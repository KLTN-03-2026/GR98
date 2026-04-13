import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseTransactionDto, WarehouseTransactionQueryDto } from './dto/create-warehouse-transaction.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WarehouseTransactionService {
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

  async create(dto: CreateWarehouseTransactionDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new BadRequestException('Không xác định được Admin quản lý');

    // Validate warehouse
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, adminId },
    });
    if (!warehouse) throw new NotFoundException('Kho không tồn tại');

    // Validate inventory lot
    const lot = await this.prisma.inventoryLot.findFirst({
      where: { id: dto.inventoryLotId, warehouseId: dto.warehouseId },
    });
    if (!lot) throw new NotFoundException('Lô hàng không tồn tại trong kho này');

    // Validate quantity
    if (dto.type === 'outbound') {
      if (dto.quantityKg > lot.quantityKg) {
        throw new BadRequestException(
          `Số lượng xuất (${dto.quantityKg} kg) vượt quá số lượng trong kho (${lot.quantityKg} kg)`,
        );
      }
    }

    // Validate adjustment has note
    if (dto.type === 'adjustment' && !dto.note) {
      throw new BadRequestException('Ghi chú bắt buộc khi điều chỉnh kho');
    }

    // Transaction: create transaction + update lot quantity
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.warehouseTransaction.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: lot.productId,
          inventoryLotId: dto.inventoryLotId,
          type: dto.type,
          quantityKg: dto.type === 'outbound' ? -dto.quantityKg : dto.quantityKg,
          createdBy: userId,
          note: dto.note,
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true } },
        },
      });

      // Update lot quantity
      const newQuantity =
        dto.type === 'outbound' ? lot.quantityKg - dto.quantityKg : lot.quantityKg + dto.quantityKg;

      await tx.inventoryLot.update({
        where: { id: dto.inventoryLotId },
        data: { quantityKg: newQuantity },
      });

      // Update product stock
      await tx.product.update({
        where: { id: lot.productId },
        data: { stockKg: { increment: dto.type === 'outbound' ? -dto.quantityKg : dto.quantityKg } },
      });

      return transaction;
    });
  }

  async findAll(query: WarehouseTransactionQueryDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new BadRequestException('Không có quyền xem giao dịch');

    const where: any = { warehouse: { adminId } };

    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;

    if (query.date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.createdAt = { gte: today, lt: tomorrow };
    } else if (query.date === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      where.createdAt = { gte: weekAgo };
    } else if (query.date === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      where.createdAt = { gte: monthAgo };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.warehouseTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
      this.prisma.warehouseTransaction.count({ where }),
    ]);

    return new PaginatedResponse(data, total, page, limit);
  }

  async getRecent(userId: string, limit = 5) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new BadRequestException('Không có quyền xem');

    return this.prisma.warehouseTransaction.findMany({
      where: { warehouse: { adminId } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { name: true } },
        product: { select: { name: true } },
      },
    });
  }
}
