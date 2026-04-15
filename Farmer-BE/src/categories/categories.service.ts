import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoryDto,
} from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
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

  private async ensureSlugUnique(
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    const existing = await this.prisma.category.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (existing) {
      // Nếu trùng, thêm timestamp để unique
      return `${slug}-${Date.now()}`;
    }
    return slug;
  }

  // ─── findAll ───────────────────────────────────────────────────────────────

  async findAll(query: { page?: string; limit?: string; search?: string }) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '50', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: data.map((c) => ({
        ...c,
        productCount: c._count.products,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── findAll (public — for client) ─────────────────────────────────────────

  async findAllForClient() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return categories.map((c) => ({
      ...c,
      productCount: c._count.products,
      _count: undefined,
    }));
  }

  // ─── findOne ───────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const item = await this.prisma.category.findFirst({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!item) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return { ...item, productCount: item._count.products, _count: undefined };
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.category.findFirst({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!item) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return { ...item, productCount: item._count.products, _count: undefined };
  }

  // ─── create ────────────────────────────────────────────────────────────────

  async create(dto: CreateCategoryDto) {
    let slug = dto.slug;
    if (!slug) {
      slug = this.toSlug(dto.name);
    }
    slug = await this.ensureSlugUnique(slug);

    // Lấy max sortOrder nếu không truyền
    let sortOrder = dto.sortOrder ?? 0;
    if (dto.sortOrder === undefined) {
      const max = await this.prisma.category.aggregate({
        _max: { sortOrder: true },
      });
      sortOrder = (max._max.sortOrder ?? 0) + 1;
    }

    const data: any = {
      name: dto.name,
      slug,
      imageUrl: dto.imageUrl,
      description: dto.description,
      sortOrder,
    };

    return this.prisma.category.create({ data });
  }

  // ─── update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    let slug = dto.slug ?? existing.slug;
    // Nếu slug thay đổi → kiểm tra unique
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.ensureSlugUnique(dto.slug, id);
    } else if (dto.name && !dto.slug) {
      // Nếu đổi tên mà không đổi slug → cập nhật slug theo tên mới
      const newSlug = this.toSlug(dto.name);
      if (newSlug !== existing.slug) {
        slug = await this.ensureSlugUnique(newSlug, id);
      }
    }

    const updateData: any = {
      ...(dto.name !== undefined && { name: dto.name }),
      slug,
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    };

    return this.prisma.category.update({ where: { id }, data: updateData });
  }

  // ─── reorder ───────────────────────────────────────────────────────────────

  async reorder(dto: ReorderCategoryDto) {
    await this.prisma.$transaction(
      dto.orders.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { updated: dto.orders.length };
  }

  // ─── remove ────────────────────────────────────────────────────────────────

  async remove(id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    await this.prisma.category.delete({ where: { id } });
    return { id, deletedAt: new Date() };
  }
}
