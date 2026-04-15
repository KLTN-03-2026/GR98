import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/create-product.dto';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateSku(cropType: string): Promise<string> {
    const prefix = cropType.slice(0, 3).toUpperCase();
    const date = new Date().getFullYear();
    const count = await this.prisma.product.count();
    return `PROD-${prefix}-${date}-${(count + 1).toString().padStart(4, '0')}`;
  }

  private async resolveAdminId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({ where: { userId } });
      if (!profile) throw new ForbiddenException('Không tìm thấy hồ sơ Admin');
      return profile.id;
    }

    if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({ where: { userId } });
      if (!profile) throw new ForbiddenException('Không tìm thấy hồ sơ Nhân viên kho');
      return profile.adminId;
    }

    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async findAll(query: ProductQueryDto, userId?: string) {
    const adminId = userId ? await this.resolveAdminId(userId) : null;
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '15', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Nếu là public query -> chỉ lấy PUBLISHED
    if (!adminId) {
      where.status = 'PUBLISHED';
    } else {
      where.adminId = adminId;
      if (query.status) where.status = query.status;
    }
    if (query.cropType) where.cropType = query.cropType;
    if (query.grade) where.grade = query.grade;
    if (query.categoryId) {
      where.categories = {
        some: { categoryId: query.categoryId },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: {
            include: { category: true },
          },
          _count: {
            select: { orderItems: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        categories: item.categories.map(pc => pc.category),
        orderCount: item._count.orderItems,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    const item = await this.prisma.product.findFirst({
      where: { id, adminId },
      include: {
        categories: {
          include: { category: true },
        },
        contract: true,
        plot: true,
      },
    });

    if (!item) throw new NotFoundException('Sản phẩm không tồn tại');

    return {
      ...item,
      categories: item.categories.map(pc => pc.category),
    };
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!item) throw new NotFoundException('Sản phẩm không tồn tại');

    return {
      ...item,
      categories: item.categories.map(pc => pc.category),
    };
  }

  async create(dto: CreateProductDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);

    const slug = dto.slug || this.toSlug(dto.name);
    const sku = dto.sku || await this.generateSku(dto.cropType);

    // Kiểm tra trùng lặp
    const existing = await this.prisma.product.findFirst({
      where: { OR: [{ slug }, { sku }] },
    });
    if (existing) throw new ConflictException('Mã SKU hoặc Slug đã tồn tại');

    const { categoryIds, ...rest } = dto;

    return this.prisma.product.create({
      data: {
        ...rest,
        adminId,
        slug,
        sku,
        qrCode: uuidv4(),
        categories: categoryIds ? {
          create: categoryIds.map(cid => ({ categoryId: cid })),
        } : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    const existing = await this.prisma.product.findFirst({
      where: { id, adminId },
    });
    if (!existing) throw new NotFoundException('Sản phẩm không tồn tại');

    const { categoryIds, ...rest } = dto;

    // Nếu thay đổi tên mà không truyền slug mới -> tự động tạo slug mới
    let slug = dto.slug;
    if (dto.name && !dto.slug) {
        slug = this.toSlug(dto.name);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...rest,
          ...(slug && { slug }),
        },
      });

      // 2. Cập nhật danh mục nếu có truyền
      if (categoryIds) {
        // Xóa cũ
        await tx.productCategory.deleteMany({ where: { productId: id } });
        // Thêm mới
        await tx.productCategory.createMany({
          data: categoryIds.map(cid => ({ productId: id, categoryId: cid })),
        });
      }

      return updated;
    });
  }

  async remove(id: string, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    const item = await this.prisma.product.findFirst({
      where: { id, adminId },
      include: { _count: { select: { orderItems: true } } },
    });

    if (!item) throw new NotFoundException('Sản phẩm không tồn tại');

    if (item._count.orderItems > 0) {
      throw new ConflictException('Không thể xóa sản phẩm đã có đơn hàng');
    }

    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}
