import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePriceBoardDto,
  UpdatePriceBoardDto,
  PriceBoardQueryDto,
} from './dto/create-price-board.dto';
import { QualityGrade, Role } from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class PriceBoardService {
  constructor(private prisma: PrismaService) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async resolveAdminId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId },
      });
      return profile?.id ?? null;
    }
    if (user.role === Role.SUPERVISOR) {
      const profile = await this.prisma.supervisorProfile.findUnique({
        where: { userId },
      });
      return profile?.adminId ?? null;
    }
    return null;
  }

  // ─── create ────────────────────────────────────────────────────────────────

  async create(dto: CreatePriceBoardDto, creatorId: string) {
    const adminId = await this.resolveAdminId(creatorId);
    if (!adminId) {
      throw new ForbiddenException('Không xác định được Admin quản lý');
    }

    // Kiểm tra trùng: cropType + grade + adminId (cùng loại + cùng grade chỉ 1 bản ghi active)
    const existing = await this.prisma.priceBoard.findFirst({
      where: {
        adminId,
        cropType: dto.cropType,
        grade: dto.grade,
        isActive: true,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Bảng giá cho "${dto.cropType}" - Grade ${dto.grade} đã tồn tại và đang active. Vui lòng cập nhật bảng giá đó thay vì tạo mới.`,
      );
    }

    const data: any = {
      adminId,
      cropType: dto.cropType,
      grade: dto.grade,
      buyPrice: dto.buyPrice,
      sellPrice: dto.sellPrice,
      effectiveDate: dto.effectiveDate
        ? new Date(dto.effectiveDate)
        : new Date(),
    };

    return this.prisma.priceBoard.create({ data });
  }

  // ─── findAll ───────────────────────────────────────────────────────────────

  async findAll(query: PriceBoardQueryDto, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const adminId = await this.resolveAdminId(currentUserId);

    // Supervisor: chỉ thấy bảng giá của admin mình phụ trách
    // ADMIN: chỉ thấy bảng giá của chính mình
    const where: any = {};
    if (adminId) {
      where.adminId = adminId;
    } else {
      throw new ForbiddenException('Không có quyền xem bảng giá');
    }

    if (query.cropType) {
      where.cropType = { contains: query.cropType, mode: 'insensitive' };
    }
    if (query.grade) {
      where.grade = query.grade;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.priceBoard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { effectiveDate: 'desc' },
        include: {
          admin: {
            select: { id: true, businessName: true, province: true },
          },
        },
      }),
      this.prisma.priceBoard.count({ where }),
    ]);

    return new PaginatedResponse(data, total, page, limit);
  }

  // ─── findOne ──────────────────────────────────────────────────────────────

  async findOne(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);
    if (!adminId) throw new ForbiddenException('Không có quyền xem bảng giá');

    const item = await this.prisma.priceBoard.findFirst({
      where: { id, adminId },
      include: {
        admin: {
          select: { id: true, businessName: true, province: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Bảng giá không tồn tại hoặc bạn không có quyền xem',
      );
    }

    return item;
  }

  // ─── update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdatePriceBoardDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);
    if (!adminId)
      throw new ForbiddenException('Không có quyền cập nhật bảng giá');

    const existing = await this.prisma.priceBoard.findFirst({
      where: { id, adminId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Bảng giá không tồn tại hoặc bạn không có quyền sửa',
      );
    }

    // Nếu đổi cropType/grade → kiểm tra trùng
    const newCropType = dto.cropType ?? existing.cropType;
    const newGrade = dto.grade ?? existing.grade;
    if (dto.cropType || dto.grade) {
      const conflict = await this.prisma.priceBoard.findFirst({
        where: {
          adminId,
          cropType: newCropType,
          grade: newGrade,
          id: { not: id },
          isActive: true,
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Bảng giá cho "${newCropType}" - Grade ${newGrade} đã tồn tại và đang active.`,
        );
      }
    }

    const updateData: any = { ...dto };
    delete updateData.effectiveDate;
    if (dto.effectiveDate) {
      updateData.effectiveDate = new Date(dto.effectiveDate);
    }

    return this.prisma.priceBoard.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── toggle active ─────────────────────────────────────────────────────────

  async toggleActive(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);
    if (!adminId)
      throw new ForbiddenException('Không có quyền cập nhật bảng giá');

    const existing = await this.prisma.priceBoard.findFirst({
      where: { id, adminId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Bảng giá không tồn tại hoặc bạn không có quyền sửa',
      );
    }

    return this.prisma.priceBoard.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  // ─── remove ────────────────────────────────────────────────────────────────

  async remove(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);
    if (!adminId) throw new ForbiddenException('Không có quyền xóa bảng giá');

    const existing = await this.prisma.priceBoard.findFirst({
      where: { id, adminId },
    });
    if (!existing) {
      throw new NotFoundException(
        'Bảng giá không tồn tại hoặc bạn không có quyền xóa',
      );
    }

    await this.prisma.priceBoard.delete({ where: { id } });
    return { id, deletedAt: new Date() };
  }
}
