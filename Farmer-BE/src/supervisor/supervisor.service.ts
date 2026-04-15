import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { QuerySupervisorDto } from './dto/query-supervisor.dto';
import { UpdateSupervisorDto } from './dto/update-supervisor.dto';

@Injectable()
export class SupervisorService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveAdminId(currentUserId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền quản lý giám sát viên');
    }

    const adminProfile = await this.prisma.adminProfile.findUnique({
      where: { userId: currentUserId },
    });

    if (!adminProfile) {
      throw new ForbiddenException('Không xác định được hồ sơ Admin');
    }

    return adminProfile.id;
  }

  private async ensureZoneInTenant(adminId: string, zoneId?: string | null) {
    if (!zoneId) {
      return null;
    }

    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, adminId },
      select: { id: true },
    });

    if (!zone) {
      throw new NotFoundException('Khu vực không tồn tại trong đơn vị quản lý');
    }

    return zone.id;
  }

  private async generateEmployeeCode(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let i = 0; i < 6; i += 1) {
      const now = Date.now().toString();
      const candidate = `SP-${now.slice(-6)}${Math.floor(Math.random() * 9)}`;
      const found = await tx.supervisorProfile.findUnique({
        where: { employeeCode: candidate },
      });
      if (!found) {
        return candidate;
      }
    }

    return `SP-${Date.now()}`;
  }

  private mapSupervisor(item: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatar: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
    supervisorProfile: {
      id: string;
      employeeCode: string;
      adminId: string;
      zoneId: string | null;
      hiredAt: Date;
      lat: number | null;
      lng: number | null;
      lastSeenAt: Date | null;
      zone: {
        id: string;
        name: string;
        province: string;
        district: string;
      } | null;
      _count: {
        assignments: number;
        dailyReports: number;
        farmers: number;
      };
    } | null;
  }) {
    return {
      id: item.id,
      email: item.email,
      fullName: item.fullName,
      phone: item.phone,
      avatar: item.avatar,
      role: item.role,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supervisorProfile: item.supervisorProfile,
    };
  }

  async create(dto: CreateSupervisorDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const phone = dto.phone?.trim();
    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone },
        select: { id: true },
      });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    const zoneId = await this.ensureZoneInTenant(adminId, dto.zoneId);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: phone || null,
          avatar: dto.avatar || null,
          role: Role.SUPERVISOR,
          status: UserStatus.ACTIVE,
        },
      });

      const employeeCode = await this.generateEmployeeCode(tx);

      await tx.supervisorProfile.create({
        data: {
          userId: user.id,
          adminId,
          zoneId,
          employeeCode,
        },
      });

      return user;
    });

    return this.findOne(created.id, currentUserId);
  }

  async findAll(query: QuerySupervisorDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const supervisorProfileFilter: Prisma.SupervisorProfileWhereInput = {
      adminId,
      ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    };

    const where: Prisma.UserWhereInput = {
      role: Role.SUPERVISOR,
      ...(query.status ? { status: query.status } : {}),
      supervisorProfile: {
        is: supervisorProfileFilter,
      },
    };

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        {
          supervisorProfile: {
            is: {
              employeeCode: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          supervisorProfile: {
            is: {
              zone: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          supervisorProfile: {
            select: {
              id: true,
              employeeCode: true,
              adminId: true,
              zoneId: true,
              hiredAt: true,
              lat: true,
              lng: true,
              lastSeenAt: true,
              zone: {
                select: {
                  id: true,
                  name: true,
                  province: true,
                  district: true,
                },
              },
              _count: {
                select: {
                  assignments: true,
                  dailyReports: true,
                  farmers: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = rows.map((item) => this.mapSupervisor(item));
    return new PaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const item = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.SUPERVISOR,
        supervisorProfile: {
          is: { adminId },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        supervisorProfile: {
          select: {
            id: true,
            employeeCode: true,
            adminId: true,
            zoneId: true,
            hiredAt: true,
            lat: true,
            lng: true,
            lastSeenAt: true,
            zone: {
              select: {
                id: true,
                name: true,
                province: true,
                district: true,
              },
            },
            _count: {
              select: {
                assignments: true,
                dailyReports: true,
                farmers: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Giám sát viên không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    return this.mapSupervisor(item);
  }

  async update(id: string, dto: UpdateSupervisorDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.SUPERVISOR,
        supervisorProfile: {
          is: { adminId },
        },
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'Giám sát viên không tồn tại hoặc bạn không có quyền cập nhật',
      );
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicateEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (duplicateEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    const normalizedPhone = dto.phone?.trim();
    if (normalizedPhone && normalizedPhone !== existing.phone) {
      const duplicatePhone = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      if (duplicatePhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    if (dto.zoneId !== undefined) {
      await this.ensureZoneInTenant(adminId, dto.zoneId);
    }

    const userData: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) userData.fullName = dto.fullName;
    if (dto.email !== undefined) userData.email = dto.email;
    if (dto.phone !== undefined) userData.phone = normalizedPhone || null;
    if (dto.status !== undefined) userData.status = dto.status;

    if (dto.clearAvatar) {
      userData.avatar = null;
    } else if (dto.avatar !== undefined) {
      userData.avatar = dto.avatar;
    }

    const profileData: Prisma.SupervisorProfileUpdateInput = {};
    if (dto.zoneId !== undefined) {
      profileData.zone = dto.zoneId
        ? { connect: { id: dto.zoneId } }
        : { disconnect: true };
    }
    if (dto.lat !== undefined) profileData.lat = dto.lat;
    if (dto.lng !== undefined) profileData.lng = dto.lng;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id },
          data: userData,
        });
      }

      if (Object.keys(profileData).length > 0) {
        await tx.supervisorProfile.update({
          where: { userId: id },
          data: profileData,
        });
      }
    });

    return this.findOne(id, currentUserId);
  }

  async remove(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.SUPERVISOR,
        supervisorProfile: {
          is: { adminId },
        },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        'Giám sát viên không tồn tại hoặc bạn không có quyền xóa',
      );
    }

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new ConflictException(
          'Không thể xóa giám sát viên vì đang có dữ liệu liên quan',
        );
      }
      throw error;
    }

    return { id, deletedAt: new Date() };
  }
}
