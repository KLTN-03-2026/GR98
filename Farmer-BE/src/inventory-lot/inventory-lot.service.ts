import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryLotDto, InventoryLotQueryDto } from './dto/create-inventory-lot.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Role, QualityGrade } from '@prisma/client';

@Injectable()
export class InventoryLotService {
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

  async create(dto: CreateInventoryLotDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new BadRequestException('Không xác định được Admin quản lý');

    // Validate warehouse
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, adminId },
    });
    if (!warehouse) throw new NotFoundException('Kho không tồn tại hoặc bạn không có quyền');

    // Validate product
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, adminId },
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // Validate harvestDate
    if (dto.harvestDate) {
      const harvestDate = new Date(dto.harvestDate);
      if (harvestDate > new Date()) {
        throw new BadRequestException('Ngày thu hoạch không được lớn hơn ngày hiện tại');
      }
    }

    // Validate expiryDate
    if (dto.expiryDate && dto.harvestDate) {
      const expiryDate = new Date(dto.expiryDate);
      const harvestDate = new Date(dto.harvestDate);
      if (expiryDate <= harvestDate) {
        throw new BadRequestException('Hạn sử dụng phải lớn hơn ngày thu hoạch');
      }
    }

    const lot = await this.prisma.inventoryLot.create({
      data: {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        contractId: dto.contractId,
        quantityKg: dto.quantityKg,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        qualityGrade: dto.qualityGrade as QualityGrade,
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    // Tự động tạo transaction inbound
    await this.prisma.warehouseTransaction.create({
      data: {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        inventoryLotId: lot.id,
        type: 'inbound',
        quantityKg: dto.quantityKg,
        createdBy: userId,
        note: dto.note ?? 'Nhập kho ban đầu',
      },
    });

    // Update product stock
    await this.prisma.product.update({
      where: { id: dto.productId },
      data: { stockKg: { increment: dto.quantityKg } },
    });

    return lot;
  }

  async findAll(query: InventoryLotQueryDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new BadRequestException('Không có quyền xem lô hàng');

    const where: any = { warehouse: { adminId } };

    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.productId) where.productId = query.productId;
    if (query.qualityGrade) where.qualityGrade = query.qualityGrade;

    if (query.alert === 'low-stock') {
      where.quantityKg = { lt: 50 };
    } else if (query.alert === 'expiring') {
      const today = new Date();
      const warningDate = new Date();
      warningDate.setDate(today.getDate() + 7);
      where.expiryDate = { lte: warningDate, gt: today };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.inventoryLot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
      this.prisma.inventoryLot.count({ where }),
    ]);

    return new PaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    if (!adminId) throw new BadRequestException('Không có quyền xem lô hàng');

    const lot = await this.prisma.inventoryLot.findFirst({
      where: { id, warehouse: { adminId } },
      include: {
        warehouse: { select: { id: true, name: true, locationAddress: true } },
        product: { select: { id: true, name: true, sku: true, cropType: true, grade: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            quantityKg: true,
            createdAt: true,
            createdBy: true,
            note: true,
          },
        },
      },
    });

    if (!lot) throw new NotFoundException('Lô hàng không tồn tại');
    return lot;
  }
}
