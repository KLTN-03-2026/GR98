import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FarmerStatus, Prisma, Role, UserStatus } from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { QueryFarmerDto } from './dto/query-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';

type FarmerReadActor =
  | { role: 'ADMIN'; adminId: string }
  | { role: 'SUPERVISOR'; adminId: string; supervisorProfileId: string };

type FarmerWriteActor =
  | { role: 'ADMIN'; adminId: string }
  | { role: 'SUPERVISOR'; adminId: string; supervisorProfileId: string };

@Injectable()
export class FarmerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ghi dữ liệu: ADMIN thao tác toàn tenant; SUPERVISOR chỉ thao tác nông dân của mình */
  private async resolveFarmerWriteActor(
    currentUserId: string,
  ): Promise<FarmerWriteActor> {
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
      return { role: 'ADMIN', adminId: adminProfile.id };
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
        role: 'SUPERVISOR',
        adminId: supervisorProfile.adminId,
        supervisorProfileId: supervisorProfile.id,
      };
    }

    throw new ForbiddenException('Bạn không có quyền quản lý nông dân');
  }

  /** Đọc danh sách / chi tiết: ADMIN toàn tenant; SUPERVISOR chỉ nông dân được gán cho mình. */
  private async resolveFarmerReadActor(
    currentUserId: string,
  ): Promise<FarmerReadActor> {
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
      return { role: 'ADMIN', adminId: adminProfile.id };
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
        role: 'SUPERVISOR',
        adminId: supervisorProfile.adminId,
        supervisorProfileId: supervisorProfile.id,
      };
    }

    throw new ForbiddenException('Bạn không có quyền xem danh sách nông dân');
  }

  private async ensureSupervisorInTenant(
    adminId: string,
    supervisorId?: string | null,
  ) {
    if (supervisorId === undefined) {
      return undefined;
    }

    if (!supervisorId) {
      return null;
    }

    const supervisor = await this.prisma.supervisorProfile.findFirst({
      where: {
        id: supervisorId,
        adminId,
      },
      select: {
        id: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!supervisor) {
      throw new NotFoundException(
        'Giám sát viên không tồn tại trong đơn vị quản lý',
      );
    }

    if (supervisor.user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Giám sát viên không ở trạng thái hoạt động',
      );
    }

    return supervisor.id;
  }

  private mapFarmer(item: {
    id: string;
    adminId: string;
    fullName: string;
    phone: string;
    cccd: string;
    bankAccount: string | null;
    address: string | null;
    province: string | null;
    status: FarmerStatus;
    createdAt: Date;
    supervisorId: string | null;
    supervisor: {
      id: string;
      employeeCode: string;
      user: {
        id: string;
        fullName: string;
        status: string;
      };
    } | null;
    _count: {
      plots: number;
      contracts: number;
    };
  }) {
    return {
      id: item.id,
      adminId: item.adminId,
      fullName: item.fullName,
      phone: item.phone,
      cccd: item.cccd,
      bankAccount: item.bankAccount,
      address: item.address,
      province: item.province,
      status: item.status,
      createdAt: item.createdAt,
      supervisorId: item.supervisorId,
      supervisor: item.supervisor,
      _count: item._count,
    };
  }

  async create(dto: CreateFarmerDto, currentUserId: string) {
    const actor = await this.resolveFarmerWriteActor(currentUserId);
    const adminId = actor.adminId;

    const normalizedPhone = dto.phone.trim();
    const normalizedCccd = dto.cccd.trim();

    const duplicateCccd = await this.prisma.farmer.findUnique({
      where: { cccd: normalizedCccd },
      select: { id: true },
    });
    if (duplicateCccd) {
      throw new ConflictException('CCCD đã được sử dụng');
    }

    const duplicatePhone = await this.prisma.farmer.findFirst({
      where: {
        adminId,
        phone: normalizedPhone,
      },
      select: { id: true },
    });
    if (duplicatePhone) {
      throw new ConflictException(
        'Số điện thoại đã tồn tại trong đơn vị quản lý',
      );
    }

    const supervisorId =
      actor.role === 'SUPERVISOR'
        ? actor.supervisorProfileId
        : await this.ensureSupervisorInTenant(adminId, dto.supervisorId);

    const created = await this.prisma.farmer.create({
      data: {
        adminId,
        fullName: dto.fullName.trim(),
        phone: normalizedPhone,
        cccd: normalizedCccd,
        bankAccount: dto.bankAccount?.trim() || null,
        address: dto.address?.trim() || null,
        province: dto.province?.trim() || null,
        status: dto.status ?? FarmerStatus.ACTIVE,
        supervisorId: supervisorId ?? null,
      },
      select: { id: true },
    });

    return this.findOne(created.id, currentUserId);
  }

  async findAll(query: QueryFarmerDto, currentUserId: string) {
    const actor = await this.resolveFarmerReadActor(currentUserId);
    const adminId = actor.adminId;

    const where: Prisma.FarmerWhereInput = {
      adminId,
      ...(query.status ? { status: query.status } : {}),
      ...(actor.role === 'SUPERVISOR'
        ? { supervisorId: actor.supervisorProfileId }
        : query.supervisorId
          ? { supervisorId: query.supervisorId }
          : {}),
      ...(query.province?.trim()
        ? {
            province: {
              contains: query.province.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
    };

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { cccd: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { province: { contains: search, mode: 'insensitive' } },
        {
          supervisor: {
            user: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.farmer.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          adminId: true,
          fullName: true,
          phone: true,
          cccd: true,
          bankAccount: true,
          address: true,
          province: true,
          status: true,
          createdAt: true,
          supervisorId: true,
          supervisor: {
            select: {
              id: true,
              employeeCode: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  status: true,
                },
              },
            },
          },
          _count: {
            select: {
              plots: true,
              contracts: true,
            },
          },
        },
      }),
      this.prisma.farmer.count({ where }),
    ]);

    const data = rows.map((item) => this.mapFarmer(item));
    return new PaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string, currentUserId: string) {
    const actor = await this.resolveFarmerReadActor(currentUserId);
    const adminId = actor.adminId;

    const item = await this.prisma.farmer.findFirst({
      where: {
        id,
        adminId,
        ...(actor.role === 'SUPERVISOR'
          ? { supervisorId: actor.supervisorProfileId }
          : {}),
      },
      select: {
        id: true,
        adminId: true,
        fullName: true,
        phone: true,
        cccd: true,
        bankAccount: true,
        address: true,
        province: true,
        status: true,
        createdAt: true,
        supervisorId: true,
        supervisor: {
          select: {
            id: true,
            employeeCode: true,
            user: {
              select: {
                id: true,
                fullName: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            plots: true,
            contracts: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Nông dân không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    return this.mapFarmer(item);
  }

  async update(id: string, dto: UpdateFarmerDto, currentUserId: string) {
    const actor = await this.resolveFarmerWriteActor(currentUserId);
    const adminId = actor.adminId;

    const existing = await this.prisma.farmer.findFirst({
      where: {
        id,
        adminId,
        ...(actor.role === 'SUPERVISOR'
          ? { supervisorId: actor.supervisorProfileId }
          : {}),
      },
      select: {
        id: true,
        phone: true,
        cccd: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Nông dân không tồn tại hoặc bạn không có quyền cập nhật',
      );
    }

    const normalizedCccd = dto.cccd?.trim();
    if (normalizedCccd && normalizedCccd !== existing.cccd) {
      const duplicateCccd = await this.prisma.farmer.findUnique({
        where: { cccd: normalizedCccd },
        select: { id: true },
      });
      if (duplicateCccd) {
        throw new ConflictException('CCCD đã được sử dụng');
      }
    }

    const normalizedPhone = dto.phone?.trim();
    if (normalizedPhone && normalizedPhone !== existing.phone) {
      const duplicatePhone = await this.prisma.farmer.findFirst({
        where: {
          adminId,
          phone: normalizedPhone,
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicatePhone) {
        throw new ConflictException(
          'Số điện thoại đã tồn tại trong đơn vị quản lý',
        );
      }
    }

    const updateData: Prisma.FarmerUpdateInput = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone.trim();
    if (dto.cccd !== undefined) updateData.cccd = dto.cccd.trim();
    if (dto.bankAccount !== undefined)
      updateData.bankAccount = dto.bankAccount?.trim() || null;
    if (dto.address !== undefined)
      updateData.address = dto.address?.trim() || null;
    if (dto.province !== undefined)
      updateData.province = dto.province?.trim() || null;
    if (dto.status !== undefined) updateData.status = dto.status;

    if (dto.supervisorId !== undefined) {
      if (actor.role === 'SUPERVISOR') {
        if (
          dto.supervisorId &&
          dto.supervisorId !== actor.supervisorProfileId
        ) {
          throw new ForbiddenException(
            'Bạn không thể chuyển nông dân sang giám sát viên khác',
          );
        }
        updateData.supervisor = { connect: { id: actor.supervisorProfileId } };
      } else {
        const supervisorId = await this.ensureSupervisorInTenant(
          adminId,
          dto.supervisorId,
        );
        updateData.supervisor = supervisorId
          ? { connect: { id: supervisorId } }
          : { disconnect: true };
      }
    }

    await this.prisma.farmer.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(id, currentUserId);
  }

  async remove(id: string, currentUserId: string) {
    const actor = await this.resolveFarmerWriteActor(currentUserId);
    const adminId = actor.adminId;

    const existing = await this.prisma.farmer.findFirst({
      where: {
        id,
        adminId,
        ...(actor.role === 'SUPERVISOR'
          ? { supervisorId: actor.supervisorProfileId }
          : {}),
      },
      select: {
        id: true,
        _count: {
          select: {
            plots: true,
            contracts: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Nông dân không tồn tại hoặc bạn không có quyền xóa',
      );
    }

    if (existing._count.plots > 0 || existing._count.contracts > 0) {
      throw new BadRequestException(
        'Không thể xóa nông dân đã phát sinh lô đất hoặc hợp đồng',
      );
    }

    await this.prisma.farmer.delete({ where: { id } });

    return {
      id,
      deletedAt: new Date().toISOString(),
    };
  }
}
