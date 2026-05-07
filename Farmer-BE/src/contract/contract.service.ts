import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignStatus,
  ContractStatus,
  PlotStatus,
  Prisma,
  Role,
  UserStatus,
} from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import {
  RejectContractDto,
  UpdateContractDto,
} from './dto/update-contract.dto';

type ActorContext = {
  userId: string;
  role: Role;
  adminId: string;
  supervisorProfileId?: string;
};

type DraftPlotInput = {
  plotId: string | null;
  plotDraftProvince: string | null;
  plotDraftDistrict: string | null;
  plotDraftAreaHa: number | null;
};

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveActorContext(
    currentUserId: string,
  ): Promise<ActorContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Không xác định được người dùng hợp lệ');
    }

    if (user.role === Role.ADMIN) {
      const adminProfile = await this.prisma.adminProfile.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });
      if (!adminProfile) {
        throw new ForbiddenException('Không xác định được hồ sơ Admin');
      }

      return {
        userId: currentUserId,
        role: user.role,
        adminId: adminProfile.id,
      };
    }

    if (user.role === Role.SUPERVISOR) {
      const supervisorProfile = await this.prisma.supervisorProfile.findUnique({
        where: { userId: currentUserId },
        select: { id: true, adminId: true },
      });
      if (!supervisorProfile?.adminId) {
        throw new ForbiddenException('Không xác định được hồ sơ giám sát viên');
      }

      return {
        userId: currentUserId,
        role: user.role,
        adminId: supervisorProfile.adminId,
        supervisorProfileId: supervisorProfile.id,
      };
    }

    if (user.role === Role.INVENTORY) {
      const inventoryProfile = await this.prisma.inventoryProfile.findUnique({
        where: { userId: currentUserId },
        select: { id: true, adminId: true },
      });
      if (!inventoryProfile?.adminId) {
        throw new ForbiddenException('Không xác định được hồ sơ nhân viên kho');
      }

      return {
        userId: currentUserId,
        role: user.role,
        adminId: inventoryProfile.adminId,
      };
    }

    throw new ForbiddenException('Bạn không có quyền quản lý hợp đồng');
  }

  private buildTraceabilityQr(contractNo: string) {
    const baseUrl = process.env.APP_WEB_URL || 'http://localhost:5173';
    return `${baseUrl}/trace/contracts/${contractNo}`;
  }

  private normalizeOptionalString(value?: string | null) {
    if (value === undefined || value === null) return null;
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  private normalizeCropTypeForPlot(cropType: string) {
    const normalized = cropType.trim().toLowerCase();
    if (normalized === 'ca-phe') return 'Cà phê';
    if (normalized === 'sau-rieng') return 'Sầu riêng';
    return cropType.trim();
  }

  private buildPlotCode(adminId: string): string {
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, '0');
    return `PL-${ymd}-${adminId.slice(-3).toUpperCase()}${rand}`;
  }

  private assertDraftPlotInput(input: DraftPlotInput) {
    if (input.plotId) {
      return;
    }

    if (!input.plotDraftProvince || !input.plotDraftDistrict) {
      throw new BadRequestException(
        'Thiếu thông tin lô đất nháp (tỉnh/thành và quận/huyện)',
      );
    }

    if (!input.plotDraftAreaHa || input.plotDraftAreaHa <= 0) {
      throw new BadRequestException(
        'Thiếu hoặc sai diện tích lô đất (plotDraftAreaHa)',
      );
    }
  }

  private normalizeCoordinatesText(value?: string | null) {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Split by newline to get each coordinate pair line (format: "lat,lng")
    const rawLines = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!rawLines.length) return null;

    const normalizedLines: string[] = [];
    for (const line of rawLines) {
      const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length !== 2) {
        throw new BadRequestException(
          'Mỗi dòng tọa độ phải có đúng 2 giá trị (vĩ độ, kinh độ), cách nhau bởi dấu phẩy',
        );
      }
      const [latStr, lngStr] = parts;
      if (Number.isNaN(Number(latStr)) || Number.isNaN(Number(lngStr))) {
        throw new BadRequestException('Tọa độ phải là danh sách số hợp lệ');
      }
      normalizedLines.push(`${latStr},${lngStr}`);
    }

    return normalizedLines.join('\n');
  }


  private assertDateRange(signedAt?: Date | null, harvestDue?: Date | null) {
    if (!signedAt || !harvestDue) return;
    if (signedAt.getTime() > harvestDue.getTime()) {
      throw new BadRequestException('Ngày ký không được lớn hơn ngày kết thúc hợp đồng');
    }
  }

  private async ensureFarmerAndPlotInTenant(
    adminId: string,
    farmerId: string | undefined,
    plotId: string,
  ): Promise<string> {
    const [plot, farmerFromId] = await Promise.all([
      this.prisma.plot.findFirst({
        where: { id: plotId, adminId },
        select: { id: true, farmerId: true },
      }),
      farmerId
        ? this.prisma.farmer.findFirst({
            where: { id: farmerId, adminId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!plot) {
      throw new NotFoundException('Lô đất không tồn tại trong đơn vị quản lý');
    }
    if (farmerFromId && plot.farmerId !== farmerFromId.id) {
      throw new BadRequestException('Lô đất không thuộc nông dân đã chọn');
    }
    return plot.farmerId;
  }

  private async ensureFarmerInTenant(
    adminId: string,
    farmerId: string | undefined,
  ): Promise<string> {
    if (!farmerId) {
      throw new BadRequestException('Chưa có nông dân (farmerId)');
    }
    const farmer = await this.prisma.farmer.findFirst({
      where: { id: farmerId, adminId },
      select: { id: true },
    });
    if (!farmer) {
      throw new NotFoundException('Nông dân không tồn tại trong đơn vị quản lý');
    }
    return farmer.id;
  }


  private async ensureSupervisorCanManagePlot(
    supervisorProfileId: string,
    adminId: string,
    plotId: string,
  ) {
    const canManage = await this.prisma.assignment.findFirst({
      where: {
        adminId,
        plotId,
        supervisorId: supervisorProfileId,
        status: { in: [AssignStatus.PENDING, AssignStatus.ACTIVE] },
      },
      select: { id: true },
    });

    if (!canManage) {
      throw new ForbiddenException(
        'Bạn chỉ được thao tác hợp đồng thuộc lô đất mình phụ trách',
      );
    }
  }

  private async ensureUniqueContractNo(contractNo: string, excludeId?: string) {
    const existing = await this.prisma.contract.findUnique({
      where: { contractNo },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Mã hợp đồng đã tồn tại');
    }
  }

  private async generateUniqueContractNo(adminId: string): Promise<string> {
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
    const tenantSuffix = adminId.slice(-4).toUpperCase();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const random = Math.floor(1000 + Math.random() * 9000);
      const contractNo = `HDLK-${yyyymmdd}-${tenantSuffix}${random}`;
      const exists = await this.prisma.contract.findUnique({
        where: { contractNo },
        select: { id: true },
      });
      if (!exists) {
        return contractNo;
      }
    }

    throw new ConflictException(
      'Không thể tạo mã hợp đồng duy nhất, vui lòng thử lại',
    );
  }

  private getSelectContractDetail() {
    return {
      id: true,
      adminId: true,
      supervisorId: true,
      contractNo: true,
      cropType: true,
      grade: true,
      status: true,
      plotDraftProvince: true,
      plotDraftDistrict: true,
      plotDraftAreaHa: true,
      plotDraftCoordinatesText: true,
      signedAt: true,
      harvestDue: true,
      signatureUrl: true,
      traceabilityQr: true,
      submittedAt: true,
      approvedAt: true,
      approvedBy: true,
      rejectedReason: true,
      createdAt: true,
      supervisor: {
        select: {
          id: true,
          employeeCode: true,
          hiredAt: true,
          zone: {
            select: {
              id: true,
              name: true,
              province: true,
              district: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
            },
          },
        },
      },
      farmer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          cccd: true,
          bankAccount: true,
          bankName: true,
          bankBranch: true,
          address: true,
          province: true,
        },
      },
      plot: {
        select: {
          id: true,
          plotCode: true,
          cropType: true,
          areaHa: true,
          status: true,
          estimatedYieldKg: true,
          zone: {
            select: {
              province: true,
              district: true,
            },
          },
        },
      },
      admin: {
        select: {
          businessName: true,
          province: true,
          taxCode: true,
          bankAccount: true,
        },
      },
    } satisfies Prisma.ContractSelect;
  }

  private mapContract(
    item: Prisma.ContractGetPayload<{
      select: ReturnType<ContractService['getSelectContractDetail']>;
    }>,
  ) {
    return {
      id: item.id,
      adminId: item.adminId,
      supervisorId: item.supervisorId,
      contractNo: item.contractNo,
      cropType: item.cropType,
      grade: item.grade,
      status: item.status,
      plotDraftProvince: item.plotDraftProvince,
      plotDraftDistrict: item.plotDraftDistrict,
      plotDraftAreaHa: item.plotDraftAreaHa,
      plotDraftCoordinatesText: item.plotDraftCoordinatesText,
      signedAt: item.signedAt,
      harvestDue: item.harvestDue,
      signatureUrl: item.signatureUrl,
      traceabilityQr: item.traceabilityQr,
      submittedAt: item.submittedAt,
      approvedAt: item.approvedAt,
      approvedBy: item.approvedBy,
      rejectedReason: item.rejectedReason,
      createdAt: item.createdAt,
      farmer: {
        id: item.farmer.id,
        fullName: item.farmer.fullName,
        phone: item.farmer.phone,
        cccd: item.farmer.cccd,
        bankAccount: item.farmer.bankAccount,
        bankName: item.farmer.bankName,
        bankBranch: item.farmer.bankBranch,
        address: item.farmer.address,
        province: item.farmer.province,
      },
      plot: {
        id: item.plot?.id ?? '',
        plotCode: item.plot?.plotCode ?? '—',
        cropType: item.plot?.cropType ?? item.cropType,
        areaHa: item.plot?.areaHa ?? item.plotDraftAreaHa ?? 0,
        status: item.plot?.status ?? 'AVAILABLE',
        estimatedYieldKg: item.plot?.estimatedYieldKg ?? null,
        province: item.plot?.zone?.province ?? item.plotDraftProvince ?? null,
        district: item.plot?.zone?.district ?? item.plotDraftDistrict ?? null,
      },
      supervisor: {
        id: item.supervisor.id,
        employeeCode: item.supervisor.employeeCode,
        fullName: item.supervisor.user.fullName,
        userId: item.supervisor.user.id,
        email: item.supervisor.user.email,
        phone: item.supervisor.user.phone,
        status: item.supervisor.user.status,
        hiredAt: item.supervisor.hiredAt,
        zone: item.supervisor.zone
          ? {
              id: item.supervisor.zone.id,
              name: item.supervisor.zone.name,
              province: item.supervisor.zone.province,
              district: item.supervisor.zone.district,
            }
          : null,
      },
      admin: {
        businessName: item.admin.businessName,
        province: item.admin.province,
        taxCode: item.admin.taxCode,
        bankAccount: item.admin.bankAccount,
      },
    };
  }

  async create(dto: CreateContractDto, currentUserId: string) {
    const actor = await this.resolveActorContext(currentUserId);
    if (actor.role !== Role.SUPERVISOR || !actor.supervisorProfileId) {
      throw new ForbiddenException('Bạn không có quyền tạo hợp đồng');
    }

    const normalizedPlotId = this.normalizeOptionalString(dto.plotId);
    const draftPlotInput: DraftPlotInput = {
      plotId: normalizedPlotId,
      plotDraftProvince: this.normalizeOptionalString(dto.plotDraftProvince),
      plotDraftDistrict: this.normalizeOptionalString(dto.plotDraftDistrict),
      plotDraftAreaHa: dto.plotDraftAreaHa ?? null,
    };
    this.assertDraftPlotInput(draftPlotInput);
    const normalizedCoordinatesText = this.normalizeCoordinatesText(
      dto.plotDraftCoordinatesText,
    );

    const signedAt = dto.signedAt ? new Date(dto.signedAt) : null;
    const harvestDue = dto.harvestDue ? new Date(dto.harvestDue) : null;
    this.assertDateRange(signedAt, harvestDue);

    const hasPlot = Boolean(normalizedPlotId);
    const normalizedFarmerId = this.normalizeOptionalString(dto.farmerId);
    let resolvedFarmerId: string;

    if (hasPlot) {
      resolvedFarmerId = await this.ensureFarmerAndPlotInTenant(
        actor.adminId,
        normalizedFarmerId ?? undefined,
        normalizedPlotId as string,
      );
    } else if (normalizedFarmerId) {
      resolvedFarmerId = await this.ensureFarmerInTenant(
        actor.adminId,
        normalizedFarmerId,
      );
    } else {
      throw new BadRequestException('Thiếu thông tin nông dân trong hợp đồng (farmerId)');
    }

    if (hasPlot) {
      await this.ensureSupervisorCanManagePlot(
        actor.supervisorProfileId,
        actor.adminId,
        normalizedPlotId as string,
      );
    }

    const contractNo = await this.generateUniqueContractNo(actor.adminId);

    const created = await this.prisma.contract.create({
      data: {
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
        farmerId: resolvedFarmerId,
        plotId: normalizedPlotId,
        contractNo,
        cropType: dto.cropType.trim(),
        plotDraftProvince: hasPlot ? null : draftPlotInput.plotDraftProvince,
        plotDraftDistrict: hasPlot ? null : draftPlotInput.plotDraftDistrict,
        plotDraftAreaHa: hasPlot ? null : draftPlotInput.plotDraftAreaHa,
        plotDraftCoordinatesText: hasPlot ? null : normalizedCoordinatesText,
        grade: dto.grade,
        status: ContractStatus.DRAFT,
        signedAt,
        harvestDue,
        signatureUrl: dto.signatureUrl?.trim() || null,
        traceabilityQr: this.buildTraceabilityQr(contractNo),
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
        rejectedReason: null,
      },
      select: { id: true },
    });

    return this.findOne(created.id, currentUserId);
  }

  async findAll(query: QueryContractDto, currentUserId: string) {
    const actor = await this.resolveActorContext(currentUserId);

    const andConditions: Prisma.ContractWhereInput[] = [
      { adminId: actor.adminId },
    ];

    if (actor.role === Role.SUPERVISOR && actor.supervisorProfileId) {
      andConditions.push({ supervisorId: actor.supervisorProfileId });
    }

    if (query.status) {
      andConditions.push({ status: query.status });
    } else if (actor.role === Role.ADMIN || actor.role === Role.INVENTORY) {
      andConditions.push({
        status: {
          in: [
            ContractStatus.SIGNED,
            ContractStatus.ACTIVE,
            ContractStatus.REJECTED,
            ContractStatus.EXPIRED,
            ContractStatus.SETTLED,
            ContractStatus.COMPLETED,
          ],
        },
      });
    }
    if (query.cropType?.trim()) {
      andConditions.push({
        cropType: { contains: query.cropType.trim(), mode: 'insensitive' },
      });
    }
    if (query.grade) {
      andConditions.push({ grade: query.grade });
    }
    if (query.farmerId) {
      andConditions.push({ farmerId: query.farmerId });
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      andConditions.push({
        OR: [
          { contractNo: { contains: search, mode: 'insensitive' } },
          { cropType: { contains: search, mode: 'insensitive' } },
          { farmer: { fullName: { contains: search, mode: 'insensitive' } } },
          { farmer: { phone: { contains: search, mode: 'insensitive' } } },
          { farmer: { cccd: { contains: search, mode: 'insensitive' } } },
          { plot: { plotCode: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.ContractWhereInput = { AND: andConditions };
    const select = this.getSelectContractDetail();

    const [rows, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        select,
      }),
      this.prisma.contract.count({ where }),
    ]);

    const data = rows.map((item) => this.mapContract(item));
    return new PaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string, currentUserId: string) {
    const actor = await this.resolveActorContext(currentUserId);
    const select = this.getSelectContractDetail();

    const andConditions: Prisma.ContractWhereInput[] = [
      { id },
      { adminId: actor.adminId },
    ];
    if (actor.role === Role.SUPERVISOR && actor.supervisorProfileId) {
      andConditions.push({ supervisorId: actor.supervisorProfileId });
    }

    const item = await this.prisma.contract.findFirst({
      where: { AND: andConditions },
      select,
    });

    if (!item) {
      throw new NotFoundException(
        'Hợp đồng không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    return this.mapContract(item);
  }

  async update(id: string, dto: UpdateContractDto, currentUserId: string) {
    const actor = await this.resolveActorContext(currentUserId);
    if (actor.role !== Role.SUPERVISOR || !actor.supervisorProfileId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật hợp đồng');
    }

    const existing = await this.prisma.contract.findFirst({
      where: {
        id,
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
      },
      select: {
        id: true,
        farmerId: true,
        plotId: true,
        plotDraftProvince: true,
        plotDraftDistrict: true,
        plotDraftAreaHa: true,
        plotDraftCoordinatesText: true,
        signedAt: true,
        harvestDue: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Hợp đồng không tồn tại trong phạm vi phụ trách',
      );
    }

    const canEditDraft =
      existing.status === ContractStatus.DRAFT ||
      existing.status === ContractStatus.REJECTED;
    const isSignatureOnlyUpdate =
      existing.status === ContractStatus.ACTIVE &&
      dto.signatureUrl !== undefined &&
      dto.farmerId === undefined &&
      dto.plotId === undefined &&
      dto.plotDraftProvince === undefined &&
      dto.plotDraftDistrict === undefined &&
      dto.plotDraftAreaHa === undefined &&
      dto.plotDraftCoordinatesText === undefined &&
      dto.cropType === undefined &&
      dto.grade === undefined &&
      dto.signedAt === undefined &&
      dto.harvestDue === undefined;

    if (!canEditDraft && !isSignatureOnlyUpdate) {
      throw new BadRequestException('Chỉ được sửa bản nháp hoặc cập nhật ảnh ký sau duyệt');
    }

    if (isSignatureOnlyUpdate) {
      await this.prisma.contract.update({
        where: { id },
        data: { signatureUrl: dto.signatureUrl?.trim() || null },
      });
      return this.findOne(id, currentUserId);
    }

    let nextFarmerId = dto.farmerId ?? existing.farmerId;
    const inputPlotId =
      dto.plotId !== undefined
        ? this.normalizeOptionalString(dto.plotId)
        : undefined;
    const nextPlotId = inputPlotId !== undefined ? inputPlotId : existing.plotId;
    const nextPlotDraftProvince =
      dto.plotDraftProvince !== undefined
        ? this.normalizeOptionalString(dto.plotDraftProvince)
        : existing.plotDraftProvince;
    const nextPlotDraftDistrict =
      dto.plotDraftDistrict !== undefined
        ? this.normalizeOptionalString(dto.plotDraftDistrict)
        : existing.plotDraftDistrict;
    const nextPlotDraftAreaHa =
      dto.plotDraftAreaHa !== undefined
        ? dto.plotDraftAreaHa ?? null
        : existing.plotDraftAreaHa;
    const nextCoordinatesText =
      dto.plotDraftCoordinatesText !== undefined
        ? this.normalizeCoordinatesText(dto.plotDraftCoordinatesText)
        : this.normalizeCoordinatesText(existing.plotDraftCoordinatesText);

    this.assertDraftPlotInput({
      plotId: nextPlotId ?? null,
      plotDraftProvince: nextPlotDraftProvince ?? null,
      plotDraftDistrict: nextPlotDraftDistrict ?? null,
      plotDraftAreaHa: nextPlotDraftAreaHa,
    });

    if (!nextFarmerId) {
      throw new BadRequestException('Thiếu thông tin nông dân trong hợp đồng (farmerId)');
    }

    if (dto.farmerId || dto.plotId !== undefined) {
      if (nextPlotId) {
        const resolvedFarmerId = await this.ensureFarmerAndPlotInTenant(
          actor.adminId,
          nextFarmerId,
          nextPlotId,
        );
        if (!dto.farmerId) nextFarmerId = resolvedFarmerId;
      } else {
        nextFarmerId = await this.ensureFarmerInTenant(
          actor.adminId,
          nextFarmerId,
        );
      }
    }

    if (nextPlotId && nextPlotId !== existing.plotId) {
      await this.ensureSupervisorCanManagePlot(
        actor.supervisorProfileId,
        actor.adminId,
        nextPlotId,
      );
    }

    const updateData: Prisma.ContractUpdateInput = {};

    updateData.farmer = { connect: { id: nextFarmerId } };

    if (nextPlotId) {
      updateData.plot = { connect: { id: nextPlotId } };
    } else if (existing.plotId) {
      updateData.plot = { disconnect: true };
    }

    updateData.plotDraftProvince = nextPlotId ? null : nextPlotDraftProvince;
    updateData.plotDraftDistrict = nextPlotId ? null : nextPlotDraftDistrict;
    updateData.plotDraftAreaHa = nextPlotId ? null : nextPlotDraftAreaHa;
    updateData.plotDraftCoordinatesText = nextPlotId ? null : nextCoordinatesText;
    if (dto.cropType !== undefined) updateData.cropType = dto.cropType.trim();
    if (dto.grade !== undefined) updateData.grade = dto.grade;
    const nextSignedAt =
      dto.signedAt !== undefined
        ? dto.signedAt
          ? new Date(dto.signedAt)
          : null
        : existing.signedAt;
    const nextHarvestDue =
      dto.harvestDue !== undefined
        ? dto.harvestDue
          ? new Date(dto.harvestDue)
          : null
        : existing.harvestDue;
    this.assertDateRange(nextSignedAt, nextHarvestDue);
    if (dto.signedAt !== undefined) {
      updateData.signedAt = nextSignedAt;
    }
    if (dto.harvestDue !== undefined) {
      updateData.harvestDue = nextHarvestDue;
    }
    if (dto.signatureUrl !== undefined) {
      updateData.signatureUrl = dto.signatureUrl?.trim() || null;
    }
    if (existing.status === ContractStatus.DRAFT) {
      updateData.rejectedReason = null;
    }

    await this.prisma.contract.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(id, currentUserId);
  }

  async submitForApproval(id: string, currentUserId: string) {
    const actor = await this.resolveActorContext(currentUserId);
    if (actor.role !== Role.SUPERVISOR || !actor.supervisorProfileId) {
      throw new ForbiddenException('Bạn không có quyền gửi duyệt hợp đồng');
    }

    const existing = await this.prisma.contract.findFirst({
      where: {
        id,
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
      },
      select: {
        id: true,
        status: true,
        signedAt: true,
        harvestDue: true,
        farmerId: true,
        plotId: true,
        plotDraftProvince: true,
        plotDraftDistrict: true,
        plotDraftAreaHa: true,
        contractNo: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Hợp đồng không tồn tại trong phạm vi phụ trách',
      );
    }
    if (
      existing.status !== ContractStatus.DRAFT &&
      existing.status !== ContractStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Chỉ hợp đồng nháp hoặc đang bị từ chối mới có thể gửi yêu cầu phê duyệt',
      );
    }
    this.assertDraftPlotInput({
      plotId: existing.plotId,
      plotDraftProvince: existing.plotDraftProvince,
      plotDraftDistrict: existing.plotDraftDistrict,
      plotDraftAreaHa: existing.plotDraftAreaHa,
    });
    this.assertDateRange(existing.signedAt, existing.harvestDue);

    if (!existing.farmerId) {
      throw new BadRequestException(
        'Thiếu thông tin nông dân trong hợp đồng trước khi gửi duyệt',
      );
    }

    await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.SIGNED,
        submittedAt: new Date(),
        rejectedReason: null,
        traceabilityQr: this.buildTraceabilityQr(existing.contractNo),
      },
    });

    return this.findOne(id, currentUserId);
  }

  async approve(id: string, currentUserId: string) {
    const actor = await this.resolveActorContext(currentUserId);
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền phê duyệt hợp đồng');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.contract.findFirst({
        where: { id, adminId: actor.adminId },
        select: {
          id: true,
          status: true,
          plotId: true,
          contractNo: true,
          cropType: true,
          farmerId: true,
          supervisorId: true,
          plotDraftProvince: true,
          plotDraftDistrict: true,
          plotDraftAreaHa: true,
        },
      });

      if (!existing) {
        throw new NotFoundException(
          'Hợp đồng không tồn tại trong đơn vị quản lý',
        );
      }
      if (existing.status !== ContractStatus.SIGNED) {
        throw new BadRequestException(
          'Chỉ hợp đồng chờ phê duyệt mới được phê duyệt',
        );
      }

      let nextPlotId = existing.plotId ?? null;
      if (!existing.farmerId) {
        throw new BadRequestException('Hợp đồng chưa có nông dân để phê duyệt');
      }
      const resolvedFarmerId = existing.farmerId;

      if (!nextPlotId) {
        this.assertDraftPlotInput({
          plotId: null,
          plotDraftProvince: existing.plotDraftProvince,
          plotDraftDistrict: existing.plotDraftDistrict,
          plotDraftAreaHa: existing.plotDraftAreaHa,
        });

        let plotCode = this.buildPlotCode(actor.adminId);
        for (let i = 0; i < 4; i += 1) {
          const duplicate = await tx.plot.findUnique({ where: { plotCode } });
          if (!duplicate) break;
          plotCode = this.buildPlotCode(actor.adminId);
        }

        const zone = await tx.zone.findFirst({
          where: {
            adminId: actor.adminId,
            ...(existing.plotDraftProvince
              ? {
                  province: {
                    contains: existing.plotDraftProvince,
                    mode: 'insensitive',
                  },
                }
              : {}),
            ...(existing.plotDraftDistrict
              ? {
                  district: {
                    contains: existing.plotDraftDistrict,
                    mode: 'insensitive',
                  },
                }
              : {}),
          },
          orderBy: { name: 'asc' },
        });

        const createdPlot = await tx.plot.create({
          data: {
            farmerId: resolvedFarmerId,
            adminId: actor.adminId,
            zoneId: zone?.id,
            plotCode,
            cropType: this.normalizeCropTypeForPlot(existing.cropType),
            areaHa: existing.plotDraftAreaHa as number,
            lat: null,
            lng: null,
            status: PlotStatus.CONTRACTED,
          },
          select: { id: true },
        });

        await tx.assignment.create({
          data: {
            supervisorId: existing.supervisorId,
            plotId: createdPlot.id,
            adminId: actor.adminId,
            status: AssignStatus.ACTIVE,
          },
        });

        await tx.farmer.updateMany({
          where: {
            id: resolvedFarmerId,
            adminId: actor.adminId,
          },
          data: {
            supervisorId: existing.supervisorId,
          },
        });

        nextPlotId = createdPlot.id;
      }

      await tx.contract.update({
        where: { id },
        data: {
          farmerId: resolvedFarmerId,
          plotId: nextPlotId,
          status: ContractStatus.ACTIVE,
          approvedAt: new Date(),
          approvedBy: actor.userId,
          rejectedReason: null,
        },
      });
    });

    return this.findOne(id, currentUserId);
  }

  async reject(id: string, dto: RejectContractDto, currentUserId: string) {
    const actor = await this.resolveActorContext(currentUserId);
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền từ chối hợp đồng');
    }
    const reason = dto.rejectedReason?.trim();
    if (!reason) {
      throw new BadRequestException('Lý do từ chối là bắt buộc');
    }

    const existing = await this.prisma.contract.findFirst({
      where: { id, adminId: actor.adminId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException(
        'Hợp đồng không tồn tại trong đơn vị quản lý',
      );
    }
    if (existing.status !== ContractStatus.SIGNED) {
      throw new BadRequestException(
        'Chỉ hợp đồng chờ phê duyệt mới được từ chối',
      );
    }

    await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.REJECTED,
        rejectedReason: reason,
        approvedAt: null,
        approvedBy: null,
      },
    });

    return this.findOne(id, currentUserId);
  }
}
