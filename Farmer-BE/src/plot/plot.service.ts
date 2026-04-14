import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PlotStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlotDto, PlotQueryDto } from './dto/plot.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class PlotService {
  constructor(private prisma: PrismaService) {}

  private async resolveAdminId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }

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

    if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
        where: { userId },
      });
      return profile?.adminId ?? null;
    }

    return null;
  }

  private normalizeCropType(crop: string): string {
    const normalized = crop.trim().toLowerCase();
    if (normalized === 'ca-phe') return 'Cà phê';
    if (normalized === 'sau-rieng') return 'Sầu riêng';
    return crop.trim();
  }

  private toCropTypeForUi(crop: string): 'ca-phe' | 'sau-rieng' {
    const normalized = crop.trim().toLowerCase();
    if (normalized.includes('sầu riêng') || normalized.includes('sau rieng')) {
      return 'sau-rieng';
    }
    return 'ca-phe';
  }

  private buildPlotCode(adminId: string): string {
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, '0');
    return `PL-${ymd}-${adminId.slice(-3).toUpperCase()}${rand}`;
  }

  private formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(value);
  }

  private async findFarmer(adminId: string, dto: CreatePlotDto) {
    if (dto.farmerId) {
      const byId = await this.prisma.farmer.findFirst({
        where: { id: dto.farmerId, adminId },
      });
      if (!byId) {
        throw new NotFoundException(
          'Nông dân không tồn tại trong đơn vị quản lý',
        );
      }
      if (
        dto.farmerName?.trim() &&
        byId.fullName.toLowerCase() !== dto.farmerName.trim().toLowerCase()
      ) {
        throw new BadRequestException(
          'Thông tin nông dân không khớp: tên không đúng với hồ sơ',
        );
      }

      if (
        dto.farmerPhone?.trim() &&
        byId.phone.trim() !== dto.farmerPhone.trim()
      ) {
        throw new BadRequestException(
          'Thông tin nông dân không khớp: số điện thoại không đúng',
        );
      }

      if (
        dto.farmerCccd?.trim() &&
        byId.cccd.trim() !== dto.farmerCccd.trim()
      ) {
        throw new BadRequestException(
          'Thông tin nông dân không khớp: CCCD không đúng',
        );
      }

      return byId;
    }

    if (
      !dto.farmerName?.trim() ||
      !dto.farmerPhone?.trim() ||
      !dto.farmerCccd?.trim()
    ) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ tên nông dân, số điện thoại và CCCD để xác thực',
      );
    }

    const verified = await this.prisma.farmer.findFirst({
      where: {
        adminId,
        fullName: {
          equals: dto.farmerName.trim(),
          mode: 'insensitive',
        },
        phone: dto.farmerPhone.trim(),
        cccd: dto.farmerCccd.trim(),
      },
    });

    if (!verified) {
      throw new BadRequestException(
        'Không tìm thấy nông dân trùng khớp theo tên, số điện thoại và CCCD',
      );
    }

    return verified;
  }

  private mapPlotToListItem(plot: {
    id: string;
    plotCode: string;
    cropType: string;
    areaHa: number;
    lat: number | null;
    lng: number | null;
    createdAt: Date;
    status: PlotStatus;
    farmer: {
      fullName: string;
      phone: string;
      cccd: string;
      province: string | null;
    };
    zone: { district: string; province: string } | null;
    contracts: Array<{ contractNo: string }>;
  }) {
    return {
      id: plot.id,
      lotCode: plot.plotCode,
      plotName: plot.plotCode,
      farmerName: plot.farmer?.fullName ?? 'Chưa gán',
      farmerPhone: plot.farmer?.phone ?? '',
      farmerCccd: plot.farmer?.cccd ?? '',
      contractId: plot.contracts[0]?.contractNo ?? 'Chưa có hợp đồng',
      province: plot.zone?.province ?? plot.farmer?.province ?? 'N/A',
      district: plot.zone?.district ?? 'N/A',
      areaHa: plot.areaHa,
      cropType: this.toCropTypeForUi(plot.cropType),
      progress: plot.status === PlotStatus.ACTIVE ? 'on-track' : 'attention',
      lat: plot.lat ?? 16.2,
      lng: plot.lng ?? 106.2,
      updatedAt: this.formatDateTime(plot.createdAt),
      polygon: [],
    };
  }

  async create(dto: CreatePlotDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) {
      throw new ForbiddenException('Không xác định được Admin quản lý');
    }

    const farmer = await this.findFarmer(adminId, dto);

    const zone = await this.prisma.zone.findFirst({
      where: {
        adminId,
        ...(dto.province
          ? { province: { contains: dto.province, mode: 'insensitive' } }
          : {}),
        ...(dto.district
          ? { district: { contains: dto.district, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { name: 'asc' },
    });

    let plotCode = this.buildPlotCode(adminId);
    for (let i = 0; i < 4; i += 1) {
      const exists = await this.prisma.plot.findUnique({ where: { plotCode } });
      if (!exists) {
        break;
      }
      plotCode = this.buildPlotCode(adminId);
    }

    const created = await this.prisma.plot.create({
      data: {
        farmerId: farmer.id,
        adminId,
        zoneId: zone?.id,
        plotCode,
        cropType: this.normalizeCropType(dto.cropType),
        areaHa: dto.areaHa,
        lat: dto.lat,
        lng: dto.lng,
        status: PlotStatus.ACTIVE,
      },
      include: {
        farmer: {
          select: {
            fullName: true,
            phone: true,
            cccd: true,
            province: true,
          },
        },
        zone: {
          select: {
            district: true,
            province: true,
          },
        },
        contracts: {
          select: {
            contractNo: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return this.mapPlotToListItem(created);
  }

  async findAll(query: PlotQueryDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) {
      throw new ForbiddenException('Không có quyền xem danh sách lô đất');
    }

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.PlotWhereInput = { adminId };

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { plotCode: { contains: search, mode: 'insensitive' } },
        { cropType: { contains: search, mode: 'insensitive' } },
        { farmer: { fullName: { contains: search, mode: 'insensitive' } } },
        { zone: { district: { contains: search, mode: 'insensitive' } } },
        { zone: { province: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (query.cropType?.trim()) {
      where.cropType = {
        contains: this.normalizeCropType(query.cropType),
        mode: 'insensitive',
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.plot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          farmer: {
            select: {
              fullName: true,
              phone: true,
              cccd: true,
              province: true,
            },
          },
          zone: {
            select: {
              district: true,
              province: true,
            },
          },
          contracts: {
            select: {
              contractNo: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.plot.count({ where }),
    ]);

    const data = rows.map((item) => this.mapPlotToListItem(item));
    return new PaginatedResponse(data, total, page, limit);
  }
}
