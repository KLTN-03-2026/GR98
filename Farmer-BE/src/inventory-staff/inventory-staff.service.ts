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
import { CreateInventoryStaffDto } from './dto/create-inventory-staff.dto';
import { QueryInventoryStaffDto } from './dto/query-inventory-staff.dto';
import { UpdateInventoryStaffDto } from './dto/update-inventory-staff.dto';

@Injectable()
export class InventoryStaffService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveAdminId(currentUserId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });
    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền quản lý nhân viên kho');
    }

    const adminProfile = await this.prisma.adminProfile.findUnique({
      where: { userId: currentUserId },
    });

    if (!adminProfile) {
      throw new ForbiddenException('Không xác định được hồ sơ Admin');
    }

    return adminProfile.id;
  }

  private async generateEmployeeCode(tx: Prisma.TransactionClient): Promise<string> {
    for (let i = 0; i < 6; i += 1) {
      const now = Date.now().toString();
      const candidate = `IV-${now.slice(-6)}${Math.floor(Math.random() * 9)}`;
      const found = await tx.inventoryProfile.findUnique({
        where: { employeeCode: candidate },
      });
      if (!found) {
        return candidate;
      }
    }

    return `IV-${Date.now()}`;
  }

  private mapInventoryStaff(item: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatar: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
    inventoryProfile: {
      id: string;
      employeeCode: string;
      adminId: string;
      hiredAt: Date;
      _count: { warehouses: number };
      warehouses: Array<{ id: string; name: string }>;
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
      inventoryProfile: item.inventoryProfile,
    };
  }

  async create(dto: CreateInventoryStaffDto, currentUserId: string) {
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

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: phone || null,
          avatar: dto.avatar || null,
          role: Role.INVENTORY,
          status: UserStatus.ACTIVE,
        },
      });

      const employeeCode = await this.generateEmployeeCode(tx);

      await tx.inventoryProfile.create({
        data: {
          userId: user.id,
          adminId,
          employeeCode,
        },
      });

      return user;
    });

    return this.findOne(created.id, currentUserId);
  }

  async findAll(query: QueryInventoryStaffDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const where: Prisma.UserWhereInput = {
      role: Role.INVENTORY,
      ...(query.status ? { status: query.status } : {}),
      inventoryProfile: {
        is: { adminId },
      },
    };

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        {
          inventoryProfile: {
            is: { employeeCode: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          inventoryProfile: {
            is: {
              warehouses: {
                some: {
                  name: { contains: search, mode: 'insensitive' },
                },
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
          inventoryProfile: {
            select: {
              id: true,
              employeeCode: true,
              adminId: true,
              hiredAt: true,
              _count: { select: { warehouses: true } },
              warehouses: {
                select: { id: true, name: true },
                take: 3,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = rows.map((item) => this.mapInventoryStaff(item));
    return new PaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const item = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.INVENTORY,
        inventoryProfile: {
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
        inventoryProfile: {
          select: {
            id: true,
            employeeCode: true,
            adminId: true,
            hiredAt: true,
            _count: { select: { warehouses: true } },
            warehouses: {
              select: { id: true, name: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Nhân viên kho không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    return this.mapInventoryStaff(item);
  }

  async update(id: string, dto: UpdateInventoryStaffDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.INVENTORY,
        inventoryProfile: {
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
        'Nhân viên kho không tồn tại hoặc bạn không có quyền cập nhật',
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

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({
        where: { id },
        data: userData,
      });
    }

    return this.findOne(id, currentUserId);
  }

  async remove(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.INVENTORY,
        inventoryProfile: {
          is: { adminId },
        },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        'Nhân viên kho không tồn tại hoặc bạn không có quyền xóa',
      );
    }

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new ConflictException(
          'Không thể xóa nhân viên kho vì đang có dữ liệu kho liên quan',
        );
      }
      throw error;
    }

    return { id, deletedAt: new Date() };
  }
}
