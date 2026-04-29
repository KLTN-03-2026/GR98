import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { CreatePlantScanDto } from './dto/create-plant-scan.dto';
import { QueryPlantScanDto } from './dto/query-plant-scan.dto';

type ActorContext = {
  role: Role;
  adminId: string | null;
  supervisorProfileId: string | null;
};

const scanListInclude = {
  supervisor: {
    select: {
      id: true,
      user: { select: { fullName: true } },
    },
  },
  plot: {
    select: {
      id: true,
      plotCode: true,
      cropType: true,
      farmer: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.PlantScanRecordInclude;

@Injectable()
export class PlantScanService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveActorContext(userId: string): Promise<ActorContext | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return { role: user.role, adminId: profile?.id ?? null, supervisorProfileId: null };
    }

    if (user.role === Role.SUPERVISOR) {
      const profile = await this.prisma.supervisorProfile.findUnique({
        where: { userId },
        select: { id: true, adminId: true },
      });
      return {
        role: user.role,
        adminId: profile?.adminId ?? null,
        supervisorProfileId: profile?.id ?? null,
      };
    }

    return { role: user.role, adminId: null, supervisorProfileId: null };
  }

  /** Supervisor gọi sau khi AI trả kết quả — tự động lưu */
  async create(dto: CreatePlantScanDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (actor?.role !== Role.SUPERVISOR || !actor.supervisorProfileId || !actor.adminId) {
      throw new ForbiddenException('Chỉ giám sát viên mới được lưu kết quả quét');
    }

    // Nếu có plotId, kiểm tra plot thuộc tenant này
    if (dto.plotId) {
      const plot = await this.prisma.plot.findFirst({
        where: { id: dto.plotId, adminId: actor.adminId },
        select: { id: true },
      });
      if (!plot) throw new NotFoundException('Không tìm thấy lô đất');
    }

    return this.prisma.plantScanRecord.create({
      data: {
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
        plotId: dto.plotId ?? null,
        diseaseEn: dto.diseaseEn,
        diseaseVi: dto.diseaseVi,
        causingAgent: dto.causingAgent,
        dangerLevel: dto.dangerLevel,
        category: dto.category,
        symptoms: dto.symptoms,
        treatment: dto.treatment,
        confidence: dto.confidence,
        processingMs: dto.processingMs ?? null,
        imageDataUrl: dto.imageDataUrl ?? null,
      },
      include: scanListInclude,
    });
  }

  /** Danh sách plant scan records — supervisor xem của mình, admin xem toàn tenant */
  async findAll(query: QueryPlantScanDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId) {
      throw new ForbiddenException('Không xác định được tenant');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 15;
    const skip = (page - 1) * limit;

    const where: Prisma.PlantScanRecordWhereInput = {
      adminId: actor.adminId,
    };

    if (actor.role === Role.SUPERVISOR) {
      if (!actor.supervisorProfileId) {
        throw new ForbiddenException('Không xác định được hồ sơ giám sát viên');
      }
      where.supervisorId = actor.supervisorProfileId;
    } else if (actor.role === Role.ADMIN) {
      if (query.supervisorId?.trim()) {
        where.supervisorId = query.supervisorId.trim();
      }
    } else {
      throw new ForbiddenException('Không có quyền xem dữ liệu này');
    }

    if (query.dangerLevel?.trim()) {
      where.dangerLevel = { contains: query.dangerLevel.trim(), mode: 'insensitive' };
    }
    if (query.category?.trim()) {
      where.category = query.category.trim();
    }
    if (query.plotId?.trim()) {
      where.plotId = query.plotId.trim();
    }
    if (query.from || query.to) {
      where.scannedAt = {};
      if (query.from) where.scannedAt.gte = new Date(query.from);
      if (query.to) where.scannedAt.lte = new Date(query.to);
    }

    const [rows, total] = await Promise.all([
      this.prisma.plantScanRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scannedAt: 'desc' },
        include: scanListInclude,
      }),
      this.prisma.plantScanRecord.count({ where }),
    ]);

    // Stats tổng hợp cho dashboard
    const [totalScans, diseaseCount, healthyCount, dangerHighCount] = await Promise.all([
      this.prisma.plantScanRecord.count({ where: { adminId: actor.adminId, ...(actor.role === Role.SUPERVISOR ? { supervisorId: actor.supervisorProfileId! } : {}) } }),
      this.prisma.plantScanRecord.count({ where: { adminId: actor.adminId, ...(actor.role === Role.SUPERVISOR ? { supervisorId: actor.supervisorProfileId! } : {}), category: { not: 'healthy' } } }),
      this.prisma.plantScanRecord.count({ where: { adminId: actor.adminId, ...(actor.role === Role.SUPERVISOR ? { supervisorId: actor.supervisorProfileId! } : {}), category: 'healthy' } }),
      this.prisma.plantScanRecord.count({ where: { adminId: actor.adminId, ...(actor.role === Role.SUPERVISOR ? { supervisorId: actor.supervisorProfileId! } : {}), dangerLevel: { in: ['Cao', 'Rất cao'] } } }),
    ]);

    return new PaginatedResponse(rows, total, page, limit, {
      totalScans,
      diseaseCount,
      healthyCount,
      dangerHighCount,
    });
  }

  /** Chi tiết 1 record */
  async findOne(id: string, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId) throw new ForbiddenException('Không xác định được tenant');

    const where: Prisma.PlantScanRecordWhereInput = { id, adminId: actor.adminId };
    if (actor.role === Role.SUPERVISOR) {
      where.supervisorId = actor.supervisorProfileId ?? '';
    }

    const record = await this.prisma.plantScanRecord.findFirst({
      where,
      include: scanListInclude,
    });
    if (!record) throw new NotFoundException('Không tìm thấy kết quả quét');
    return record;
  }
}
