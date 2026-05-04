import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  AssignStatus,
  ContractStatus,
  PlotStatus,
  Prisma,
  ReportStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlotDto, PlotQueryDto, UpdatePlotDto } from './dto/plot.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

type ActorContext = {
  role: Role;
  adminId: string | null;
  supervisorProfileId: string | null;
};

@Injectable()
export class PlotService {
  constructor(private prisma: PrismaService) {}

  private async resolveActorContext(
    userId: string,
  ): Promise<ActorContext | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }

    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return {
        role: user.role,
        adminId: profile?.id ?? null,
        supervisorProfileId: null,
      };
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

    if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
        where: { userId },
        select: { adminId: true },
      });
      return {
        role: user.role,
        adminId: profile?.adminId ?? null,
        supervisorProfileId: null,
      };
    }

    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
      select: { adminId: true },
    });

    return {
      role: user.role,
      adminId: profile?.adminId ?? null,
      supervisorProfileId: null,
    };
  }

  private async resolveAdminId(userId: string): Promise<string | null> {
    const actor = await this.resolveActorContext(userId);
    return actor?.adminId ?? null;
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

  /** Parse plotDraftCoordinatesText thành polygon array [[lat,lng], ...] */
  private parseCoordinatesToPolygon(
    text?: string | null,
  ): Array<[number, number]> {
    if (!text?.trim()) return [];
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const pairs: Array<[number, number]> = [];
    // Try "lat,lng" per line (correct format)
    for (const line of lines) {
      const parts = line
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          pairs.push([lat, lng]);
          continue;
        }
      }
      // Line doesn't match pair format — try fallback
      pairs.length = 0;
      break;
    }
    if (pairs.length > 0) return pairs;
    // Fallback: flat number list (legacy corrupted data)
    const nums = text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const lat = parseFloat(nums[i]);
      const lng = parseFloat(nums[i + 1]);
      if (!isNaN(lat) && !isNaN(lng)) pairs.push([lat, lng]);
    }
    return pairs;
  }

  private async findFarmer(
    adminId: string,
    dto: CreatePlotDto,
    actor?: ActorContext,
  ) {
    const supervisorScopedWhere =
      actor?.role === Role.SUPERVISOR && actor.supervisorProfileId
        ? { supervisorId: actor.supervisorProfileId }
        : {};

    if (dto.farmerId) {
      const byId = await this.prisma.farmer.findFirst({
        where: { id: dto.farmerId, adminId, ...supervisorScopedWhere },
      });
      if (!byId) {
        throw new NotFoundException(
          'Nông dân không tồn tại trong phạm vi quản lý',
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
        ...supervisorScopedWhere,
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

  private async resolveSupervisorForCreate(
    dto: CreatePlotDto,
    actor: ActorContext,
    options?: { excludePlotId?: string; allowEmptyForAdmin?: boolean },
  ): Promise<{ id: string; fullName: string } | null> {
    if (!actor.adminId) {
      throw new ForbiddenException('Không xác định được Admin quản lý');
    }

    const requestedByAdmin = dto.id_suppervisor?.trim();
    const requestedSupervisorId =
      actor.role === Role.SUPERVISOR
        ? actor.supervisorProfileId
        : requestedByAdmin || null;

    if (actor.role === Role.SUPERVISOR && !actor.supervisorProfileId) {
      throw new ForbiddenException('Không xác định được hồ sơ giám sát viên');
    }

    if (
      actor.role === Role.SUPERVISOR &&
      dto.id_suppervisor?.trim() &&
      dto.id_suppervisor.trim() !== actor.supervisorProfileId
    ) {
      throw new ForbiddenException(
        'Giám sát viên chỉ được phép tạo lô cho chính mình',
      );
    }

    if (!requestedSupervisorId) {
      if (actor.role === Role.ADMIN && options?.allowEmptyForAdmin) {
        return null;
      }
      return null;
    }

    const supervisorProfile = await this.prisma.supervisorProfile.findFirst({
      where: {
        id: requestedSupervisorId,
        adminId: actor.adminId,
      },
      select: {
        id: true,
        user: {
          select: {
            fullName: true,
            status: true,
          },
        },
      },
    });

    if (!supervisorProfile) {
      throw new NotFoundException(
        'Giám sát viên không tồn tại trong đơn vị quản lý',
      );
    }

    if (supervisorProfile.user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Giám sát viên đã bị khóa hoặc tạm ngưng');
    }

    if (
      dto.name_suppervisor?.trim() &&
      dto.name_suppervisor.trim().toLowerCase() !==
        supervisorProfile.user.fullName.trim().toLowerCase()
    ) {
      throw new BadRequestException(
        'Thông tin giám sát viên không khớp giữa id và tên',
      );
    }

    const activeAssignedCount = await this.prisma.assignment.count({
      where: {
        adminId: actor.adminId,
        supervisorId: supervisorProfile.id,
        ...(options?.excludePlotId
          ? {
              plotId: {
                not: options.excludePlotId,
              },
            }
          : {}),
        status: {
          in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
        },
      },
    });

    if (activeAssignedCount >= 10) {
      throw new BadRequestException(
        'Mỗi giám sát viên chỉ được phân công tối đa 10 lô đang hoạt động',
      );
    }

    return {
      id: supervisorProfile.id,
      fullName: supervisorProfile.user.fullName,
    };
  }

  private async findPlotByIdForListItem(plotId: string, adminId: string) {
    const plot = await this.prisma.plot.findFirst({
      where: {
        id: plotId,
        adminId,
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
            plotDraftProvince: true,
            plotDraftDistrict: true,
            plotDraftAreaHa: true,
            plotDraftCoordinatesText: true,
            signedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        assignments: {
          where: {
            status: {
              in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
            },
          },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          select: {
            supervisorId: true,
            supervisor: {
              select: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!plot) {
      throw new NotFoundException(
        'Lô đất không tồn tại hoặc bạn không có quyền',
      );
    }

    return plot;
  }

  private async createPointFromContractForSupervisor(
    dto: CreatePlotDto,
    actor: ActorContext,
  ) {
    if (!actor.adminId || !actor.supervisorProfileId) {
      throw new ForbiddenException('Không xác định được phạm vi quản lý');
    }

    const contractNo = dto.contractId?.trim();
    if (!contractNo) {
      throw new BadRequestException('Vui lòng nhập mã hợp đồng để gán point');
    }

    if (/^PL-/i.test(contractNo)) {
      throw new BadRequestException(
        'Bạn đang nhập mã lô đất. Vui lòng nhập mã hợp đồng (ví dụ HDLK-...)',
      );
    }

    let normalizedLat = Number.isFinite(dto.lat)
      ? Number((dto.lat as number).toFixed(6))
      : null;
    let normalizedLng = Number.isFinite(dto.lng)
      ? Number((dto.lng as number).toFixed(6))
      : null;

    const contract = await this.prisma.contract.findFirst({
      where: {
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
        contractNo,
        status: {
          notIn: [
            ContractStatus.CANCELLED,
            ContractStatus.TERMINATED,
            ContractStatus.EXPIRED,
          ],
        },
      },
      select: {
        id: true,
        plotId: true,
        plotDraftCoordinatesText: true,
      },
    });

    if (!contract || !contract.plotId) {
      throw new NotFoundException(
        'Không tìm thấy hợp đồng hợp lệ hoặc hợp đồng chưa được gán lô đất trong phạm vi bạn phụ trách.',
      );
    }

    const targetPlot = await this.prisma.plot.findFirst({
      where: {
        id: contract.plotId,
        adminId: actor.adminId,
        farmer: {
          supervisorId: actor.supervisorProfileId,
        },
      },
      select: {
        id: true,
        lat: true,
        lng: true,
      },
    });

    if (!targetPlot) {
      throw new NotFoundException(
        'Lô đất thuộc hợp đồng không nằm trong phạm vi phụ trách',
      );
    }

    if (targetPlot.lat !== null && targetPlot.lng !== null) {
      throw new BadRequestException('Hợp đồng này đã được gán point trên GIS');
    }

    // Auto-compute centroid from contract coordinates if lat/lng not provided
    const coords = this.parseCoordinatesToPolygon(
      contract.plotDraftCoordinatesText,
    );
    if (
      (normalizedLat === null || normalizedLng === null) &&
      coords.length >= 3
    ) {
      const centroid = coords.reduce(
        (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
        { lat: 0, lng: 0 },
      );
      normalizedLat = Number((centroid.lat / coords.length).toFixed(6));
      normalizedLng = Number((centroid.lng / coords.length).toFixed(6));
    }

    if (normalizedLat === null || normalizedLng === null) {
      throw new BadRequestException(
        'Không thể xác định vị trí: hợp đồng không có tọa độ và bạn chưa chọn point trên bản đồ',
      );
    }

    const duplicatePointPlot = await this.prisma.plot.findFirst({
      where: {
        adminId: actor.adminId,
        id: {
          not: targetPlot.id,
        },
        lat: normalizedLat,
        lng: normalizedLng,
        contracts: {
          some: {
            status: {
              notIn: [
                ContractStatus.CANCELLED,
                ContractStatus.TERMINATED,
                ContractStatus.EXPIRED,
              ],
            },
          },
        },
      },
      select: { id: true },
    });

    if (duplicatePointPlot) {
      throw new BadRequestException(
        'Point này đã được gán cho một hợp đồng khác',
      );
    }

    await this.prisma.plot.update({
      where: { id: targetPlot.id },
      data: {
        lat: normalizedLat,
        lng: normalizedLng,
      },
    });

    const refreshed = await this.findPlotByIdForListItem(
      targetPlot.id,
      actor.adminId,
    );
    return this.mapPlotToListItem(refreshed);
  }

  private mapPlotToListItem(plot: {
    id: string;
    farmerId: string;
    plotCode: string;
    cropType: string;
    areaHa: number;
    lat: number | null;
    lng: number | null;
    createdAt: Date;
    expectedHarvest: Date | null;
    status: PlotStatus;
    hasGis?: boolean;
    farmer: {
      fullName: string;
      phone: string;
      cccd: string;
      province: string | null;
    };
    zone: { district: string; province: string } | null;
    contracts: Array<{
      contractNo: string;
      plotDraftProvince: string | null;
      plotDraftDistrict: string | null;
      plotDraftAreaHa: number | null;
      plotDraftCoordinatesText: string | null;
      signedAt: Date | null;
    }>;
    assignments: Array<{
      supervisorId: string;
      supervisor: {
        user: {
          fullName: string;
        };
      };
    }>;
  }) {
    const activeAssignment = plot.assignments[0] ?? null;
    const latestContract = plot.contracts[0] ?? null;
    const isGisMarked = plot.lat !== null && plot.lng !== null;
    const hasGis =
      isGisMarked && Number.isFinite(plot.lat) && Number.isFinite(plot.lng);

    return {
      id: plot.id,
      farmerId: plot.farmerId,
      lotCode: plot.plotCode,
      plotName: plot.plotCode,
      farmerName: plot.farmer?.fullName ?? 'Chưa gán',
      farmerPhone: plot.farmer?.phone ?? '',
      farmerCccd: plot.farmer?.cccd ?? '',
      contractId: latestContract?.contractNo ?? 'Chưa có hợp đồng',
      province:
        plot.zone?.province ??
        latestContract?.plotDraftProvince ??
        plot.farmer?.province ??
        'N/A',
      district: plot.zone?.district ?? latestContract?.plotDraftDistrict ?? 'N/A',
      areaHa: latestContract?.plotDraftAreaHa ?? plot.areaHa,
      cropType: this.toCropTypeForUi(plot.cropType),
      progress: plot.status === PlotStatus.ACTIVE ? 'on-track' : 'attention',
      lat: plot.lat ?? 16.2,
      lng: plot.lng ?? 106.2,
      isGisMarked,
      updatedAt: this.formatDateTime(plot.createdAt),
      polygon: isGisMarked
        ? this.parseCoordinatesToPolygon(
            latestContract?.plotDraftCoordinatesText,
          )
        : [],
      plotDraftCoordinatesText:
        latestContract?.plotDraftCoordinatesText ?? null,
      hasGis,
      id_suppervisor: activeAssignment?.supervisorId ?? null,
      name_suppervisor: activeAssignment?.supervisor.user.fullName ?? null,
      expectedHarvest: plot.expectedHarvest?.toISOString() ?? null,
      contractSignedAt: latestContract?.signedAt?.toISOString() ?? null,
    };
  }

  async create(dto: CreatePlotDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId) {
      throw new ForbiddenException('Không xác định được Admin quản lý');
    }

    if (actor.role === Role.SUPERVISOR) {
      return this.createPointFromContractForSupervisor(dto, actor);
    }

    const adminId = actor.adminId;

    const farmer = await this.findFarmer(adminId, dto, actor);
    const assignedSupervisor = await this.resolveSupervisorForCreate(
      dto,
      actor,
    );

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

    const createdPlotId = await this.prisma.$transaction(async (tx) => {
      const newPlot = await tx.plot.create({
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
      });

      if (assignedSupervisor) {
        await tx.assignment.create({
          data: {
            supervisorId: assignedSupervisor.id,
            plotId: newPlot.id,
            adminId,
            status: AssignStatus.ACTIVE,
          },
        });

        await tx.farmer.updateMany({
          where: {
            id: farmer.id,
            adminId,
          },
          data: {
            supervisorId: assignedSupervisor.id,
          },
        });
      }

      return newPlot.id;
    });

    const created = await this.prisma.plot.findUniqueOrThrow({
      where: { id: createdPlotId },
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
            plotDraftProvince: true,
            plotDraftDistrict: true,
            plotDraftAreaHa: true,
            plotDraftCoordinatesText: true,
            signedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        assignments: {
          where: {
            status: {
              in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
            },
          },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          select: {
            supervisorId: true,
            supervisor: {
              select: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.mapPlotToListItem(created);
  }

  async findAll(query: PlotQueryDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId) {
      throw new ForbiddenException('Không có quyền xem danh sách lô đất');
    }

    const adminId = actor.adminId;

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.PlotWhereInput = { adminId };

    if (actor.role === Role.SUPERVISOR && actor.supervisorProfileId) {
      where.farmer = {
        supervisorId: actor.supervisorProfileId,
      };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { plotCode: { contains: search, mode: 'insensitive' } },
        { cropType: { contains: search, mode: 'insensitive' } },
        { farmer: { fullName: { contains: search, mode: 'insensitive' } } },
        { zone: { district: { contains: search, mode: 'insensitive' } } },
        { zone: { province: { contains: search, mode: 'insensitive' } } },
        {
          contracts: {
            some: {
              plotDraftDistrict: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          contracts: {
            some: {
              plotDraftProvince: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          assignments: {
            some: {
              supervisor: {
                user: {
                  fullName: { contains: search, mode: 'insensitive' },
                },
              },
            },
          },
        },
      ];
    }

    if (query.cropType?.trim()) {
      where.cropType = {
        contains: this.normalizeCropType(query.cropType),
        mode: 'insensitive',
      };
    }

    if (query.id_suppervisor?.trim()) {
      if (
        actor.role === Role.SUPERVISOR &&
        actor.supervisorProfileId &&
        query.id_suppervisor.trim() !== actor.supervisorProfileId
      ) {
        throw new ForbiddenException(
          'Bạn chỉ được phép xem lô đất trong phạm vi phụ trách',
        );
      }

      where.assignments = {
        some: {
          supervisorId:
            actor.role === Role.SUPERVISOR && actor.supervisorProfileId
              ? actor.supervisorProfileId
              : query.id_suppervisor.trim(),
          status: {
            in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
          },
        },
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
              plotDraftProvince: true,
              plotDraftDistrict: true,
              plotDraftAreaHa: true,
              plotDraftCoordinatesText: true,
              signedAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          assignments: {
            where: {
              status: {
                in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
              },
            },
            orderBy: { assignedAt: 'desc' },
            take: 1,
            select: {
              supervisorId: true,
              supervisor: {
                select: {
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.plot.count({ where }),
    ]);

    const data = rows.map((item) => this.mapPlotToListItem(item));
    return new PaginatedResponse(data, total, page, limit);
  }

  async update(plotId: string, dto: UpdatePlotDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId) {
      throw new ForbiddenException('Không xác định được Admin quản lý');
    }

    // Ensure AdminId exists for context
    const adminId = actor.adminId;

    const plot = await this.prisma.plot.findFirst({
      where: {
        id: plotId,
        adminId,
      },
      select: {
        id: true,
        farmerId: true,
      },
    });

    if (!plot) {
      throw new NotFoundException(
        'Lô đất không tồn tại hoặc bạn không có quyền',
      );
    }

    // If SUPERVISOR updates GIS, ensure they are assigned to this plot.
    if (actor.role === Role.SUPERVISOR) {
      const assignment = await this.prisma.assignment.findFirst({
        where: {
          adminId,
          plotId: plot.id,
          supervisorId: actor.supervisorProfileId ?? undefined,
          status: {
            in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
          },
        },
        select: { id: true },
      });
      if (!assignment) {
        throw new ForbiddenException(
          'Bạn chỉ được cập nhật GIS cho các lô đất mình phụ trách',
        );
      }
    }

    const requestedSupervisor = await this.resolveSupervisorForCreate(
      {
        plotName: 'update-plot',
        cropType: 'ca-phe',
        areaHa: 1,
        id_suppervisor: dto.id_suppervisor,
        name_suppervisor: dto.name_suppervisor,
      },
      actor,
      {
        excludePlotId: plot.id,
        allowEmptyForAdmin: true,
      },
    );

    const currentActiveAssignment = await this.prisma.assignment.findFirst({
      where: {
        plotId: plot.id,
        adminId,
        status: {
          in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
        },
      },
      orderBy: { assignedAt: 'desc' },
      select: {
        id: true,
        supervisorId: true,
      },
    });

    const requestedSupervisorId = requestedSupervisor?.id ?? null;
    const currentSupervisorId = currentActiveAssignment?.supervisorId ?? null;

    const shouldChangeAssignment =
      requestedSupervisorId !== currentSupervisorId;

    await this.prisma.$transaction(async (tx) => {
      if (shouldChangeAssignment) {
        if (currentActiveAssignment) {
          await tx.assignment.updateMany({
            where: {
              plotId: plot.id,
              adminId,
              status: {
                in: [AssignStatus.PENDING, AssignStatus.ACTIVE],
              },
            },
            data: {
              status: AssignStatus.CANCELLED,
              note: 'Reassigned from Plot Sheet',
            },
          });
        }

        if (requestedSupervisorId) {
          await tx.assignment.create({
            data: {
              supervisorId: requestedSupervisorId,
              plotId: plot.id,
              adminId,
              status: AssignStatus.ACTIVE,
            },
          });

          await tx.farmer.updateMany({
            where: {
              id: plot.farmerId,
              adminId,
            },
            data: {
              supervisorId: requestedSupervisorId,
            },
          });
        }
      }

      // GIS fields (SUP vẽ) update
      const nextData: Prisma.PlotUpdateInput = {};
      if (dto.lat !== undefined) nextData.lat = dto.lat;
      if (dto.lng !== undefined) nextData.lng = dto.lng;

      if (Object.keys(nextData).length > 0) {
        await tx.plot.update({
          where: { id: plot.id },
          data: nextData,
        });
      }
    });

    const refreshed = await this.findPlotByIdForListItem(plot.id, adminId);
    return this.mapPlotToListItem(refreshed);
  }

  async remove(plotId: string, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId || actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có quyền xóa lô đất');
    }

    const adminId = actor.adminId;
    const plot = await this.prisma.plot.findFirst({
      where: {
        id: plotId,
        adminId,
      },
      select: {
        id: true,
        _count: {
          select: {
            contracts: true,
            dailyReports: true,
            products: true,
          },
        },
      },
    });

    if (!plot) {
      throw new NotFoundException(
        'Lô đất không tồn tại hoặc bạn không có quyền',
      );
    }

    if (
      plot._count.contracts > 0 ||
      plot._count.dailyReports > 0 ||
      plot._count.products > 0
    ) {
      throw new BadRequestException(
        'Không thể xóa lô đất đã phát sinh hợp đồng/báo cáo/sản phẩm',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.assignment.deleteMany({
        where: {
          plotId: plot.id,
          adminId,
        },
      });

      await tx.plot.delete({
        where: { id: plot.id },
      });
    });

    return {
      id: plot.id,
      deletedAt: new Date().toISOString(),
    };
  }

  async completeHarvest(plotId: string, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId || actor.role !== Role.SUPERVISOR) {
      throw new ForbiddenException(
        'Chỉ Giám sát viên mới có quyền hoàn tất thu hoạch',
      );
    }

    const plot = await this.prisma.plot.findFirst({
      where: { id: plotId, adminId: actor.adminId },
      include: {
        assignments: {
          where: {
            supervisorId: actor.supervisorProfileId!,
            status: { in: [AssignStatus.PENDING, AssignStatus.ACTIVE] },
          },
        },
      },
    });

    if (!plot) {
      throw new NotFoundException('Không tìm thấy lô đất');
    }

    if (plot.assignments.length === 0) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên lô đất này');
    }

    if (plot.status === PlotStatus.HARVESTED) {
      throw new BadRequestException('Lô đất này đã hoàn tất thu hoạch');
    }

    // Kiểm tra xem đã có báo cáo sản lượng (UC-17) chưa
    const harvestReport = await this.prisma.dailyReport.findFirst({
      where: {
        plotId,
        yieldEstimateKg: { gt: 0 },
        status: { in: [ReportStatus.SUBMITTED, ReportStatus.REVIEWED] },
      },
    });

    if (!harvestReport) {
      throw new BadRequestException(
        'Không thể hoàn tất thu hoạch. Yêu cầu phải có ít nhất một báo cáo ghi nhận sản lượng thực tế đã gửi.',
      );
    }

    const updated = await this.prisma.plot.update({
      where: { id: plotId },
      data: { status: PlotStatus.HARVESTED },
      include: {
        farmer: { select: { fullName: true, phone: true, cccd: true, province: true } },
        zone: { select: { district: true, province: true } },
        contracts: { select: { contractNo: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        assignments: {
          where: { status: { in: [AssignStatus.PENDING, AssignStatus.ACTIVE] } },
          include: { supervisor: { select: { user: { select: { fullName: true } } } } },
        },
      },
    });

    return this.mapPlotToListItem(updated as any);
  }
}
