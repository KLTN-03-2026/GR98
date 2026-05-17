import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async resolveAdminIdFromToken(
    userId: string,
  ): Promise<string | null> {
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
    if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
        where: { userId },
      });
      return profile?.adminId ?? null;
    }
    if (user.role === Role.CLIENT) {
      const profile = await this.prisma.clientProfile.findUnique({
        where: { userId },
      });
      return profile?.adminId ?? null;
    }
    return null;
  }

  private getTenantFilter(adminId: string | null, currentRole: Role): any {
    if (currentRole === Role.ADMIN) {
      if (!adminId) return {};
      return {
        OR: [
          { adminProfile: { id: adminId } },
          { supervisorProfile: { adminId } },
          { inventoryProfile: { adminId } },
          { clientProfile: { adminId } },
          { shipperProfile: { adminId } },
        ],
      };
    }
    if (currentRole === Role.SUPERVISOR) {
      if (!adminId) return {};
      return {
        OR: [
          { supervisorProfile: { adminId } },
          { inventoryProfile: { adminId } },
          { clientProfile: { adminId } },
          { shipperProfile: { adminId } },
        ],
      };
    }
    return {};
  }

  // ─── create ────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, creatorId: string) {
    if (dto.role === Role.CLIENT) {
      throw new BadRequestException(
        'Không tạo tài khoản khách hàng qua chức năng Quản lý tài khoản',
      );
    }

    if (dto.role === Role.ADMIN) {
      const existingAdmin = await this.prisma.user.findFirst({
        where: { role: Role.ADMIN },
        select: { id: true },
      });

      if (existingAdmin) {
        throw new ConflictException(
          'Hệ thống chỉ cho phép 1 tài khoản Admin. Không thể tạo Admin thứ 2',
        );
      }
    }

    // 1. Check email unique
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // 2. Check phone unique if provided
    const phoneTrimmed = dto.phone?.trim();
    if (phoneTrimmed) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: phoneTrimmed },
      });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    // 3. Resolve tenant context
    const creatorAdminId = await this.resolveAdminIdFromToken(creatorId);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 4. Create user + profile in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          fullName: dto.fullName,
          phone: phoneTrimmed || null,
          avatar: dto.avatar || null,
          role: dto.role,
        },
      });

      if (dto.role === Role.ADMIN) {
        await tx.adminProfile.create({
          data: {
            userId: createdUser.id,
            businessName: dto.businessName ?? dto.fullName,
            province: dto.province ?? 'Hà Nội',
          },
        });
      } else if (dto.role === Role.SUPERVISOR) {
        if (!creatorAdminId) {
          throw new ForbiddenException('Không xác định được Admin quản lý');
        }
        await tx.supervisorProfile.create({
          data: {
            userId: createdUser.id,
            adminId: creatorAdminId,
            employeeCode: `SP-${createdUser.id.slice(-6).toUpperCase()}`,
          },
        });
      } else if (dto.role === Role.INVENTORY) {
        if (!creatorAdminId) {
          throw new ForbiddenException('Không xác định được Admin quản lý');
        }
        await tx.inventoryProfile.create({
          data: {
            userId: createdUser.id,
            adminId: creatorAdminId,
            employeeCode: `IV-${createdUser.id.slice(-6).toUpperCase()}`,
          },
        });
      } else if (dto.role === Role.SHIPPER) {
        if (!creatorAdminId) {
          throw new ForbiddenException('Không xác định được Admin quản lý');
        }
        await tx.shipperProfile.create({
          data: {
            userId: createdUser.id,
            adminId: creatorAdminId,
            employeeCode: `SHP-${createdUser.id.slice(-6).toUpperCase()}`,
            vehicleType: dto.vehicleType ?? 'MOTORBIKE',
            licensePlate: dto.licensePlate ?? null,
          },
        });
      } else if (dto.role === Role.CLIENT) {
        await tx.clientProfile.create({
          data: {
            userId: createdUser.id,
            adminId: creatorAdminId,
            province: dto.province ?? null,
          },
        });
      }

      return createdUser;
    });

    return this.formatUser(user);
  }

  // ─── findAll ───────────────────────────────────────────────────────────────

  async findAll(
    pagination: PaginationDto,
    currentUserId: string,
    filters?: {
      search?: string;
      role?: Role;
      status?: UserStatus;
      excludeClient?: boolean;
    },
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');

    const tenantFilter = this.getTenantFilter(
      await this.resolveAdminIdFromToken(currentUserId),
      currentUser.role,
    );

    const where: any = {
      ...tenantFilter,
      ...(filters?.role
        ? { role: filters.role }
        : filters?.excludeClient
          ? { role: { not: Role.CLIENT } }
          : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search
        ? {
            OR: [
              { fullName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
              { phone: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
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
          adminProfile: {
            select: { id: true, businessName: true, province: true },
          },
          supervisorProfile: {
            select: {
              id: true,
              employeeCode: true,
              adminId: true,
              _count: {
                select: {
                  farmers: true,
                  assignments: true,
                  contracts: true,
                },
              },
            },
          },
          inventoryProfile: {
            select: { id: true, employeeCode: true, adminId: true },
          },
          clientProfile: {
            select: { id: true, province: true },
          },
          shipperProfile: {
            select: { id: true, employeeCode: true, adminId: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  // ─── findOne ──────────────────────────────────────────────────────────────

  async findOne(id: string, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');

    const tenantFilter = this.getTenantFilter(
      await this.resolveAdminIdFromToken(currentUserId),
      currentUser.role,
    );

    const user = await this.prisma.user.findFirst({
      where: { id, ...tenantFilter },
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
        adminProfile: {
          select: {
            id: true,
            businessName: true,
            province: true,
            taxCode: true,
            bankAccount: true,
          },
        },
        supervisorProfile: {
          select: {
            id: true,
            employeeCode: true,
            adminId: true,
            zoneId: true,
            hiredAt: true,
          },
        },
        inventoryProfile: {
          select: {
            id: true,
            employeeCode: true,
            adminId: true,
            hiredAt: true,
          },
        },
        clientProfile: {
          select: { id: true, province: true },
        },
        shipperProfile: {
          select: {
            id: true,
            employeeCode: true,
            adminId: true,
            hiredAt: true,
          },
        },
      },
    });

    if (!user)
      throw new NotFoundException(
        'Người dùng không tồn tại hoặc bạn không có quyền xem',
      );

    return user;
  }

  // ─── update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');

    const tenantFilter = this.getTenantFilter(
      await this.resolveAdminIdFromToken(currentUserId),
      currentUser.role,
    );

    const existing = await this.prisma.user.findFirst({
      where: { id, ...tenantFilter },
    });
    if (!existing)
      throw new NotFoundException(
        'Người dùng không tồn tại hoặc bạn không có quyền sửa',
      );

    if (existing.role === Role.CLIENT) {
      const hasForbiddenChange =
        dto.fullName !== undefined ||
        dto.email !== undefined ||
        dto.phone !== undefined ||
        dto.password !== undefined ||
        dto.role !== undefined ||
        dto.avatar !== undefined ||
        dto.clearAvatar !== undefined ||
        dto.province !== undefined ||
        dto.businessName !== undefined ||
        dto.defaultAddress !== undefined;

      if (hasForbiddenChange) {
        throw new ForbiddenException(
          'Tài khoản khách hàng chỉ được phép thay đổi trạng thái hoặc xóa',
        );
      }
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email !== existing.email) {
      const dup = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (dup) throw new ConflictException('Email đã được sử dụng');
    }

    // Check phone uniqueness if changing
    const phoneTrimmed = dto.phone?.trim();
    if (phoneTrimmed && phoneTrimmed !== existing.phone) {
      const dup = await this.prisma.user.findFirst({
        where: { phone: phoneTrimmed },
      });
      if (dup) throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    const currentAdminId = await this.resolveAdminIdFromToken(currentUserId);
    const nextRole = dto.role ?? existing.role;

    if (
      existing.role === Role.CLIENT &&
      dto.role !== undefined &&
      dto.role !== Role.CLIENT
    ) {
      throw new ForbiddenException(
        'Không đổi vai trò tài khoản khách hàng qua màn Quản lý tài khoản',
      );
    }

    if (existing.role === Role.ADMIN && nextRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Không hỗ trợ đổi vai trò cho tài khoản Admin',
      );
    }

    // Build user-level update data
    const updateData: any = { ...dto };
    delete updateData.password;
    delete updateData.businessName;
    delete updateData.province;
    delete updateData.defaultAddress;
    delete updateData.clearAvatar;

    // Handle avatar
    if (dto.clearAvatar) {
      updateData.avatar = null;
    } else if (dto.avatar !== undefined) {
      updateData.avatar = dto.avatar;
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
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
        },
      });

      if (existing.role !== nextRole) {
        if (!currentAdminId) {
          throw new ForbiddenException('Không xác định được Admin quản lý');
        }

        if (nextRole === Role.SUPERVISOR) {
          const profile = await tx.supervisorProfile.findUnique({
            where: { userId: id },
          });
          if (!profile) {
            await tx.supervisorProfile.create({
              data: {
                userId: id,
                adminId: currentAdminId,
                employeeCode: `SP-${id.slice(-6).toUpperCase()}`,
              },
            });
          }
        }

        if (nextRole === Role.INVENTORY) {
          const profile = await tx.inventoryProfile.findUnique({
            where: { userId: id },
          });
          if (!profile) {
            await tx.inventoryProfile.create({
              data: {
                userId: id,
                adminId: currentAdminId,
                employeeCode: `IV-${id.slice(-6).toUpperCase()}`,
              },
            });
          }
        }

        if (nextRole === Role.CLIENT) {
          const profile = await tx.clientProfile.findUnique({
            where: { userId: id },
          });
          if (!profile) {
            await tx.clientProfile.create({
              data: {
                userId: id,
                adminId: currentAdminId,
                province: dto.province ?? null,
              },
            });
          }
        }

        if (nextRole === Role.SHIPPER) {
          const profile = await tx.shipperProfile.findUnique({
            where: { userId: id },
          });
          if (!profile) {
            await tx.shipperProfile.create({
              data: {
                userId: id,
                adminId: currentAdminId,
                employeeCode: `SHP-${id.slice(-6).toUpperCase()}`,
                vehicleType: 'MOTORBIKE',
              },
            });
          }
        }
      }

      // Update ADMIN profile
      if (nextRole === Role.ADMIN) {
        const adminUpdate: any = {};
        if (dto.businessName !== undefined)
          adminUpdate.businessName = dto.businessName;
        if (dto.province !== undefined) adminUpdate.province = dto.province;
        if (Object.keys(adminUpdate).length > 0) {
          await tx.adminProfile.update({
            where: { userId: id },
            data: adminUpdate,
          });
        }
      }

      // Update CLIENT profile
      if (nextRole === Role.CLIENT) {
        const clientUpdate: any = {};
        if (dto.province !== undefined) clientUpdate.province = dto.province;
        if (Object.keys(clientUpdate).length > 0) {
          await tx.clientProfile.upsert({
            where: { userId: id },
            create: {
              userId: id,
              adminId: currentAdminId,
              province: dto.province ?? null,
            },
            update: clientUpdate,
          });
        }
      }

      return u;
    });

    return updatedUser;
  }

  // ─── remove ────────────────────────────────────────────────────────────────

  async remove(id: string, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');

    const tenantFilter = this.getTenantFilter(
      await this.resolveAdminIdFromToken(currentUserId),
      currentUser.role,
    );

    const existing = await this.prisma.user.findFirst({
      where: { id, ...tenantFilter },
      include: {
        supervisorProfile: {
          select: { id: true },
        },
      },
    });
    if (!existing)
      throw new NotFoundException(
        'Người dùng không tồn tại hoặc bạn không có quyền xóa',
      );

    if (id === currentUserId) {
      throw new ForbiddenException('Không thể tự xóa tài khoản của chính mình');
    }

    // ── SUPERVISOR: dùng soft-delete thay vì xóa cứng ──────────────────────
    // Lý do: Assignment / DailyReport / PlantScanRecord / Contract / Farmer
    // đều có FK trỏ về SupervisorProfile với onDelete mặc định RESTRICT.
    // Xóa cứng sẽ vỡ FK (đã thấy ở error "23001 RESTRICT"). Mặt khác, các
    // bản ghi đó là LỊCH SỬ truy xuất nguồn gốc — không được mất.
    //
    // Quy tắc:
    //   1. Nếu supervisor còn đang phụ trách farmer / có Assignment ACTIVE
    //      hoặc PENDING / có Contract còn hoạt động → CHẶN xóa, báo admin
    //      phải chuyển nông dân sang supervisor khác trước.
    //   2. Nếu đã sạch dữ liệu phụ trách → đổi User.status = INACTIVE.
    //      Login flow đã chặn user khác ACTIVE (auth.service.ts), nên tài
    //      khoản này không đăng nhập được nữa.
    //   3. Các role khác (CLIENT, SHIPPER, INVENTORY) giữ logic xóa cứng cũ
    //      — chúng không vướng FK RESTRICT như supervisor.
    if (existing.role === Role.SUPERVISOR && existing.supervisorProfile) {
      const supervisorProfileId = existing.supervisorProfile.id;

      // Điều kiện chặn xóa: Farmer + Assignment PENDING/ACTIVE + Contract
      // DRAFT (chưa ký). KHÔNG chặn vì hợp đồng SIGNED/ACTIVE — đó là chữ ký
      // lịch sử của supervisor cũ, được giữ nguyên. Soft-delete không xóa
      // SupervisorProfile khỏi DB nên FK trên Contract vẫn hợp lệ.
      const [activeAssignments, draftContracts, ownedFarmers] = await Promise.all([
        this.prisma.assignment.count({
          where: {
            supervisorId: supervisorProfileId,
            status: { in: ['PENDING', 'ACTIVE'] },
          },
        }),
        this.prisma.contract.count({
          where: {
            supervisorId: supervisorProfileId,
            status: 'DRAFT',
          },
        }),
        this.prisma.farmer.count({
          where: { supervisorId: supervisorProfileId },
        }),
      ]);

      if (activeAssignments > 0 || draftContracts > 0 || ownedFarmers > 0) {
        throw new ConflictException(
          `Giám sát viên còn ${ownedFarmers} nông dân, ${activeAssignments} phân công lô đất, ` +
            `${draftContracts} hợp đồng nháp chưa ký. Vui lòng chuyển sang giám sát viên khác trước khi xóa. ` +
            `(Hợp đồng đã ký được giữ nguyên với người ký gốc và không cần chuyển.)`,
        );
      }

      await this.prisma.user.update({
        where: { id },
        data: { status: UserStatus.INACTIVE },
      });

      return { id, deactivatedAt: new Date(), softDeleted: true };
    }

    await this.prisma.user.delete({ where: { id } });
    return { id, deletedAt: new Date() };
  }

  // ─── formatters ─────────────────────────────────────────────────────────────

  private formatUser(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatar: string | null;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
