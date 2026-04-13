import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto, WarehouseQueryDto } from './dto/create-warehouse.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  private async resolveAdminId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({ where: { userId } });
      return profile?.id ?? null;
    }
    if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({ where: { userId } });
      return profile?.adminId ?? null;
    }
    return null;
  }

  async create(dto: CreateWarehouseDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new Error('Không xác định được Admin quản lý');

    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
        locationAddress: dto.locationAddress,
        managedBy: dto.managedBy,
        adminId,
      },
      include: {
        inventory: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } },
        _count: { select: { inventoryLots: true, transactions: true } },
      },
    });
  }

  async findAll(query: WarehouseQueryDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new Error('Không có quyền xem kho');

    const where: any = { adminId };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.managedBy) where.managedBy = query.managedBy;

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          inventory: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } },
          _count: { select: { inventoryLots: true, transactions: true } },
        },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return new PaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new Error('Không có quyền xem kho');

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, adminId },
      include: {
        inventory: {
          select: { id: true, employeeCode: true, user: { select: { id: true, fullName: true, phone: true } } },
        },
        _count: { select: { inventoryLots: true, transactions: true } },
      },
    });

    if (!warehouse) throw new Error('Kho không tồn tại hoặc bạn không có quyền xem');

    return warehouse;
  }

  async update(id: string, dto: CreateWarehouseDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new Error('Không có quyền cập nhật kho');

    const existing = await this.prisma.warehouse.findFirst({ where: { id, adminId } });
    if (!existing) throw new Error('Kho không tồn tại hoặc bạn không có quyền sửa');

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        name: dto.name,
        locationAddress: dto.locationAddress,
        managedBy: dto.managedBy,
        isActive: dto.isActive,
      },
    });
  }

  async getStats(userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new Error('Không có quyền');

    const [warehouses, totalProducts] = await Promise.all([
      this.prisma.warehouse.count({ where: { adminId, isActive: true } }),
      this.prisma.inventoryLot.aggregate({
        where: { warehouse: { adminId } },
        _sum: { quantityKg: true },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [inboundToday, outboundToday] = await Promise.all([
      this.prisma.warehouseTransaction.count({
        where: { warehouse: { adminId }, type: 'inbound', createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.warehouseTransaction.count({
        where: { warehouse: { adminId }, type: 'outbound', createdAt: { gte: today, lt: tomorrow } },
      }),
    ]);

    const lowStockDays = 7;
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + lowStockDays);

    const [lowStockAlerts, expiringAlerts] = await Promise.all([
      this.prisma.inventoryLot.count({
        where: { warehouse: { adminId }, quantityKg: { lt: 50 } },
      }),
      this.prisma.inventoryLot.count({
        where: { warehouse: { adminId }, expiryDate: { lte: expiringDate, gt: today } },
      }),
    ]);

    return {
      totalWarehouses: warehouses,
      totalProducts: totalProducts._sum.quantityKg ?? 0,
      inboundToday,
      outboundToday,
      lowStockAlerts,
      expiringAlerts,
    };
  }
}
