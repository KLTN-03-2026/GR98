import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateShipperDto,
  QueryShipperDto,
  UpdateLocationDto,
  UpdateShipperDto,
} from './dto/shipper.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ShipperService {
  constructor(private prisma: PrismaService) {}

  private async resolveAdminId(currentUserId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) throw new ForbiddenException('Không có quyền');
    if (user.role === Role.ADMIN) {
      const p = await this.prisma.adminProfile.findUnique({
        where: { userId: currentUserId },
      });
      if (!p) throw new ForbiddenException('Không tìm thấy hồ sơ Admin');
      return p.id;
    }
    if (user.role === Role.SUPERVISOR) {
      const p = await this.prisma.supervisorProfile.findUnique({
        where: { userId: currentUserId },
      });
      if (!p) throw new ForbiddenException('Không tìm thấy hồ sơ Supervisor');
      return p.adminId;
    }
    throw new ForbiddenException('Không có quyền quản lý shipper');
  }

  private async generateEmployeeCode(): Promise<string> {
    for (let i = 0; i < 6; i++) {
      const candidate = `SHP-${Date.now().toString().slice(-6)}${Math.floor(
        Math.random() * 9,
      )}`;
      const found = await this.prisma.shipperProfile.findUnique({
        where: { employeeCode: candidate },
      });
      if (!found) return candidate;
    }
    return `SHP-${Date.now()}`;
  }

  // ─── ADMIN CRUD ────────────────────────────────────────────────────────

  async create(dto: CreateShipperDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email đã được sử dụng');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const employeeCode = await this.generateEmployeeCode();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        role: Role.SHIPPER,
      },
    });

    const profile = await this.prisma.shipperProfile.create({
      data: {
        userId: user.id,
        adminId,
        employeeCode,
        vehicleType: dto.vehicleType ?? 'MOTORBIKE',
        licensePlate: dto.licensePlate ?? null,
      },
    });

    return { ...profile, user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone } };
  }

  async findAll(query: QueryShipperDto, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);

    const where: any = { adminId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.user = {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);

    const [items, total] = await Promise.all([
      this.prisma.shipperProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { hiredAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              avatar: true,
              status: true,
            },
          },
          _count: { select: { deliveries: true } },
        },
      }),
      this.prisma.shipperProfile.count({ where }),
    ]);

    return new PaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string, currentUserId: string) {
    const adminId = await this.resolveAdminId(currentUserId);
    const shipper = await this.prisma.shipperProfile.findFirst({
      where: { id, adminId },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true, avatar: true } },
      },
    });
    if (!shipper) throw new NotFoundException('Shipper không tồn tại');
    return shipper;
  }

  async update(id: string, dto: UpdateShipperDto, currentUserId: string) {
    await this.findOne(id, currentUserId);

    const { fullName, phone, ...profileData } = dto;

    const shipper = await this.prisma.shipperProfile.update({
      where: { id },
      data: profileData,
      include: { user: true },
    });

    if (fullName || phone !== undefined) {
      await this.prisma.user.update({
        where: { id: shipper.userId },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(phone !== undefined ? { phone: phone || null } : {}),
        },
      });
    }

    return this.findOne(id, currentUserId);
  }

  async remove(id: string, currentUserId: string) {
    const shipper = await this.findOne(id, currentUserId);
    // Check không có đơn đang giao
    const activeDeliveries = await this.prisma.order.count({
      where: {
        shipperId: id,
        fulfillStatus: { in: ['SHIPPED'] },
      },
    });
    if (activeDeliveries > 0) {
      throw new ConflictException(
        `Shipper còn ${activeDeliveries} đơn đang giao, không thể xóa`,
      );
    }
    await this.prisma.user.delete({ where: { id: shipper.userId } });
    return { id, deletedAt: new Date() };
  }

  // ─── SHIPPER SELF-SERVICE ──────────────────────────────────────────────

  async getMyProfile(userId: string) {
    const profile = await this.prisma.shipperProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true, avatar: true } },
      },
    });
    if (!profile) throw new NotFoundException('Hồ sơ shipper không tồn tại');
    return profile;
  }

  async getMyOrders(userId: string, fulfillStatus?: string) {
    const profile = await this.getMyProfile(userId);
    const where: any = { shipperId: profile.id };
    if (fulfillStatus) where.fulfillStatus = fulfillStatus;
    else where.fulfillStatus = { in: ['SHIPPED', 'DELIVERED'] };

    return this.prisma.order.findMany({
      where,
      orderBy: { shippedAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, imageUrls: true, thumbnailUrl: true } },
          },
        },
        client: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
    });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const profile = await this.getMyProfile(userId);
    await this.prisma.shipperProfile.update({
      where: { id: profile.id },
      data: { lat: dto.lat, lng: dto.lng, lastSeenAt: new Date() },
    });
    return { ok: true };
  }
}
