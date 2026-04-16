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
  Prisma,
  Role,
  UserStatus,
} from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { RejectContractDto, UpdateContractDto } from './dto/update-contract.dto';

type ActorContext = {
  userId: string;
  role: Role;
  adminId: string;
  supervisorProfileId?: string;
};

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveActorContext(currentUserId: string): Promise<ActorContext> {
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

    throw new ForbiddenException('Bạn không có quyền quản lý hợp đồng');
  }

  private buildTraceabilityQr(contractNo: string) {
    const baseUrl = process.env.APP_WEB_URL || 'http://localhost:5173';
    return `${baseUrl}/trace/contracts/${contractNo}`;
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

  private async ensurePriceBoardInTenant(adminId: string, priceBoardId?: string) {
    if (!priceBoardId) return;
    const priceBoard = await this.prisma.priceBoard.findFirst({
      where: { id: priceBoardId, adminId },
      select: { id: true },
    });
    if (!priceBoard) {
      throw new NotFoundException('Bảng giá không tồn tại trong đơn vị quản lý');
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
      quantityKg: true,
      pricePerKg: true,
      totalAmount: true,
      grade: true,
      status: true,
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
      priceBoard: {
        select: {
          id: true,
          cropType: true,
          grade: true,
          buyPrice: true,
          sellPrice: true,
          effectiveDate: true,
          isActive: true,
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
    item: Prisma.ContractGetPayload<{ select: ReturnType<ContractService['getSelectContractDetail']> }>,
  ) {
    return {
      id: item.id,
      adminId: item.adminId,
      supervisorId: item.supervisorId,
      contractNo: item.contractNo,
      cropType: item.cropType,
      quantityKg: item.quantityKg,
      pricePerKg: item.pricePerKg,
      totalAmount: item.totalAmount,
      grade: item.grade,
      status: item.status,
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
        address: item.farmer.address,
        province: item.farmer.province,
      },
      plot: {
        id: item.plot.id,
        plotCode: item.plot.plotCode,
        cropType: item.plot.cropType,
        areaHa: item.plot.areaHa,
        status: item.plot.status,
        estimatedYieldKg: item.plot.estimatedYieldKg,
        province: item.plot.zone?.province ?? null,
        district: item.plot.zone?.district ?? null,
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
      priceBoard: item.priceBoard,
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

    const resolvedFarmerId = await this.ensureFarmerAndPlotInTenant(
      actor.adminId,
      dto.farmerId,
      dto.plotId,
    );
    await this.ensureSupervisorCanManagePlot(
      actor.supervisorProfileId,
      actor.adminId,
      dto.plotId,
    );
    await this.ensurePriceBoardInTenant(actor.adminId, dto.priceBoardId);

    const contractNo = await this.generateUniqueContractNo(actor.adminId);

    const totalAmount = Number((dto.quantityKg * dto.pricePerKg).toFixed(2));

    const created = await this.prisma.contract.create({
      data: {
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
        farmerId: resolvedFarmerId,
        plotId: dto.plotId,
        priceBoardId: dto.priceBoardId || null,
        contractNo,
        cropType: dto.cropType.trim(),
        quantityKg: dto.quantityKg,
        pricePerKg: dto.pricePerKg,
        totalAmount,
        grade: dto.grade,
        status: ContractStatus.DRAFT,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : null,
        harvestDue: dto.harvestDue ? new Date(dto.harvestDue) : null,
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

    const andConditions: Prisma.ContractWhereInput[] = [{ adminId: actor.adminId }];

    if (actor.role === Role.SUPERVISOR && actor.supervisorProfileId) {
      andConditions.push({ supervisorId: actor.supervisorProfileId });
    }

    if (query.status) {
      andConditions.push({ status: query.status });
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
        quantityKg: true,
        pricePerKg: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Hợp đồng không tồn tại trong phạm vi phụ trách');
    }

    if (existing.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ được chỉnh sửa hợp đồng ở trạng thái bản nháp',
      );
    }

    let nextFarmerId = dto.farmerId ?? existing.farmerId;
    const nextPlotId = dto.plotId ?? existing.plotId;

    if (dto.farmerId || dto.plotId) {
      const resolvedFarmerId = await this.ensureFarmerAndPlotInTenant(
        actor.adminId,
        nextFarmerId,
        nextPlotId,
      );
      if (!dto.farmerId) nextFarmerId = resolvedFarmerId;
    }

    if (dto.plotId && dto.plotId !== existing.plotId) {
      await this.ensureSupervisorCanManagePlot(
        actor.supervisorProfileId,
        actor.adminId,
        dto.plotId,
      );
    }

    if (dto.priceBoardId !== undefined) {
      await this.ensurePriceBoardInTenant(actor.adminId, dto.priceBoardId);
    }

    const nextQuantityKg = dto.quantityKg ?? existing.quantityKg;
    const nextPricePerKg = dto.pricePerKg ?? existing.pricePerKg;
    const nextTotalAmount = Number((nextQuantityKg * nextPricePerKg).toFixed(2));

    const updateData: Prisma.ContractUpdateInput = {
      farmer: { connect: { id: nextFarmerId } },
      plot: { connect: { id: nextPlotId } },
      totalAmount: nextTotalAmount,
    };

    if (dto.priceBoardId !== undefined) {
      updateData.priceBoard = dto.priceBoardId
        ? { connect: { id: dto.priceBoardId } }
        : { disconnect: true };
    }
    if (dto.cropType !== undefined) updateData.cropType = dto.cropType.trim();
    if (dto.quantityKg !== undefined) updateData.quantityKg = dto.quantityKg;
    if (dto.pricePerKg !== undefined) updateData.pricePerKg = dto.pricePerKg;
    if (dto.grade !== undefined) updateData.grade = dto.grade;
    if (dto.signedAt !== undefined) {
      updateData.signedAt = dto.signedAt ? new Date(dto.signedAt) : null;
    }
    if (dto.harvestDue !== undefined) {
      updateData.harvestDue = dto.harvestDue ? new Date(dto.harvestDue) : null;
    }
    if (dto.signatureUrl !== undefined) {
      updateData.signatureUrl = dto.signatureUrl?.trim() || null;
    }
    updateData.rejectedReason = null;

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
        signatureUrl: true,
        contractNo: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Hợp đồng không tồn tại trong phạm vi phụ trách');
    }
    if (existing.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ hợp đồng nháp mới có thể gửi yêu cầu phê duyệt',
      );
    }
    if (!existing.signatureUrl?.trim()) {
      throw new BadRequestException('Cần tải lên ảnh hợp đồng đã ký trước khi gửi');
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

    const existing = await this.prisma.contract.findFirst({
      where: { id, adminId: actor.adminId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Hợp đồng không tồn tại trong đơn vị quản lý');
    }
    if (existing.status !== ContractStatus.SIGNED) {
      throw new BadRequestException('Chỉ hợp đồng chờ phê duyệt mới được phê duyệt');
    }

    await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.ACTIVE,
        approvedAt: new Date(),
        approvedBy: actor.userId,
        rejectedReason: null,
      },
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
      throw new NotFoundException('Hợp đồng không tồn tại trong đơn vị quản lý');
    }
    if (existing.status !== ContractStatus.SIGNED) {
      throw new BadRequestException('Chỉ hợp đồng chờ phê duyệt mới được từ chối');
    }

    await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.DRAFT,
        rejectedReason: reason,
        approvedAt: null,
        approvedBy: null,
      },
    });

    return this.findOne(id, currentUserId);
  }
}
