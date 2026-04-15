import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

interface InventoryUser {
  id: string;
  role: Role;
}
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveAdminId(currentUserId: string): Promise<string> {
    const profile = await this.prisma.inventoryProfile.findUnique({
      where: { userId: currentUserId },
      select: { adminId: true },
    });

    if (!profile) {
      throw new ForbiddenException('Không xác định được hồ sơ nhân viên kho');
    }

    return profile.adminId;
  }

  private async resolveInventoryProfileId(
    currentUserId: string,
  ): Promise<string | null> {
    const profile = await this.prisma.inventoryProfile.findUnique({
      where: { userId: currentUserId },
      select: { id: true },
    });

    return profile?.id ?? null;
  }

  private async getWarehouseIds(
    adminId: string,
    inventoryProfileId: string | null,
  ): Promise<string[]> {
    const where = inventoryProfileId
      ? { adminId, managedBy: inventoryProfileId, isActive: true }
      : { adminId, isActive: true };

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      select: { id: true },
    });

    return warehouses.map((w) => w.id);
  }

  async getDashboard(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );

    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
    );

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for KPIs
    const [
      totalStockResult,
      pendingOrdersCount,
      expiringLotsCount,
      stagnantLotsResult,
      recentTransactions,
      pendingOrdersList,
    ] = await Promise.all([
      // totalStockKg
      warehouseIds.length > 0
        ? this.prisma.inventoryLot.aggregate({
            where: { warehouseId: { in: warehouseIds } },
            _sum: { quantityKg: true },
          })
        : { _sum: { quantityKg: null } },

      // pendingOrders: fulfillStatus=PENDING AND paymentStatus IN (PAID, COD)
      this.prisma.order.count({
        where: {
          adminId,
          fulfillStatus: 'PENDING',
          paymentStatus: { in: ['PENDING', 'PAID'] },
        },
      }),

      // expiringLots: expiryDate <= now + 7 days
      warehouseIds.length > 0
        ? this.prisma.inventoryLot.count({
            where: {
              warehouseId: { in: warehouseIds },
              expiryDate: { lte: sevenDaysLater },
            },
          })
        : 0,

      // stagnantLots: no outbound in last 30 days
      this.prisma.inventoryLot.count({
        where:
          warehouseIds.length > 0
            ? {
                warehouseId: { in: warehouseIds },
                createdAt: { lte: thirtyDaysAgo },
                NOT: {
                  transactions: {
                    some: {
                      type: 'outbound',
                      createdAt: { gte: thirtyDaysAgo },
                    },
                  },
                },
              }
            : { warehouseId: 'IMPOSSIBLE' },
      }),

      // recentTransactions: last 10 within 7 days, with relations
      this.prisma.warehouseTransaction.findMany({
        where: {
          warehouseId: {
            in: warehouseIds.length > 0 ? warehouseIds : ['IMPOSSIBLE'],
          },
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true } },
        },
      }),

      // pendingOrdersList: top 10 PENDING orders
      this.prisma.order.findMany({
        where: {
          adminId,
          fulfillStatus: 'PENDING',
          paymentStatus: { in: ['PENDING', 'PAID'] },
        },
        orderBy: { orderedAt: 'desc' },
        take: 10,
        include: {
          client: {
            select: {
              user: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    return {
      totalStockKg: totalStockResult._sum.quantityKg ?? 0,
      pendingOrders: pendingOrdersCount,
      expiringLots: expiringLotsCount,
      stagnantLots: stagnantLotsResult,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        warehouseId: t.warehouseId,
        productId: t.productId,
        inventoryLotId: t.inventoryLotId,
        type: t.type,
        quantityKg: t.quantityKg,
        note: t.note,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        warehouse: t.warehouse,
        product: t.product,
      })),
      pendingOrdersList: pendingOrdersList.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        total: o.total,
        fulfillStatus: o.fulfillStatus,
        paymentStatus: o.paymentStatus,
        orderedAt: o.orderedAt,
        shippingAddrText: o.shippingAddrText,
        client: o.client
          ? { user: { fullName: o.client.user.fullName } }
          : null,
      })),
    };
  }

  async getChartData(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
    );

    const now = new Date();
    const labels: string[] = [];
    const inbound: number[] = [];
    const outbound: number[] = [];
    const adjustment: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const label = dayStart.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
      labels.push(label);

      if (warehouseIds.length === 0) {
        inbound.push(0);
        outbound.push(0);
        adjustment.push(0);
        continue;
      }

      const [inboundResult, outboundResult, adjustmentResult] =
        await Promise.all([
          this.prisma.warehouseTransaction.aggregate({
            where: {
              warehouseId: { in: warehouseIds },
              type: 'inbound',
              createdAt: { gte: dayStart, lt: dayEnd },
            },
            _sum: { quantityKg: true },
          }),
          this.prisma.warehouseTransaction.aggregate({
            where: {
              warehouseId: { in: warehouseIds },
              type: 'outbound',
              createdAt: { gte: dayStart, lt: dayEnd },
            },
            _sum: { quantityKg: true },
          }),
          this.prisma.warehouseTransaction.aggregate({
            where: {
              warehouseId: { in: warehouseIds },
              type: 'adjustment',
              createdAt: { gte: dayStart, lt: dayEnd },
            },
            _sum: { quantityKg: true },
          }),
        ]);

      inbound.push(inboundResult._sum.quantityKg ?? 0);
      outbound.push(outboundResult._sum.quantityKg ?? 0);
      adjustment.push(adjustmentResult._sum.quantityKg ?? 0);
    }

    return { labels, inbound, outbound, adjustment };
  }

  async getWarehouses(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );

    const where = inventoryProfileId
      ? { adminId, managedBy: inventoryProfileId, isActive: true }
      : { adminId, isActive: true };

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: { inventoryLots: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return warehouses.map((w) => ({
      id: w.id,
      name: w.name,
      locationAddress: w.locationAddress,
      isActive: w.isActive,
      lotCount: w._count.inventoryLots,
      createdAt: w.createdAt,
    }));
  }

  async getWarehouseById(id: string, currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventoryLots: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          include: {
            product: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!warehouse || warehouse.adminId !== adminId) {
      throw new ForbiddenException(
        'Kho hàng không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    if (inventoryProfileId && warehouse.managedBy !== inventoryProfileId) {
      throw new ForbiddenException(
        'Bạn không được phân công quản lý kho hàng này',
      );
    }

    return warehouse;
  }

  async getLots(
    currentUser: InventoryUser,
    filters: {
      warehouseId?: string;
      productId?: string;
      qualityGrade?: string;
    },
  ) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
    );

    const where: any = {
      warehouseId: { in: warehouseIds.length > 0 ? warehouseIds : ['NONE'] },
    };

    if (filters.warehouseId) {
      if (!warehouseIds.includes(filters.warehouseId)) {
        throw new ForbiddenException('Bạn không có quyền truy cập kho này');
      }
      where.warehouseId = filters.warehouseId;
    }

    if (filters.productId) where.productId = filters.productId;
    if (filters.qualityGrade) where.qualityGrade = filters.qualityGrade;

    return this.prisma.inventoryLot.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLot(currentUser: InventoryUser, data: any) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
    );

    if (!warehouseIds.includes(data.warehouseId as string)) {
      throw new ForbiddenException('Bạn không có quyền nhập hàng vào kho này');
    }

    const warehouseId = data.warehouseId as string;
    const productId = data.productId as string;
    const quantityKg = Number(data.quantityKg);
    const contractId = (data.contractId as string) || null;
    const notes = (data.note as string) || 'Nhập kho lô hàng mới';

    // Transactional creation
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Lot
      const lot = await tx.inventoryLot.create({
        data: {
          warehouseId,
          productId,
          contractId,
          quantityKg,
          harvestDate: data.harvestDate
            ? new Date(data.harvestDate as string)
            : null,
          expiryDate: data.expiryDate
            ? new Date(data.expiryDate as string)
            : null,
          qualityGrade: data.qualityGrade as any,
        },
      });

      // 2. Create Inbound Transaction
      await tx.warehouseTransaction.create({
        data: {
          warehouseId,
          productId,
          inventoryLotId: lot.id,
          type: 'inbound',
          quantityKg,
          note: notes,
          createdBy: currentUser.id,
        },
      });

      // 3. Update Product stockKg
      await tx.product.update({
        where: { id: productId },
        data: {
          stockKg: { increment: quantityKg },
        },
      });

      return lot;
    });
  }

  async getLotById(id: string, currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
    );

    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id },
      include: {
        warehouse: true,
        product: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
        // Tracing: Lot -> Contract -> Farmer -> Plot
        contract: {
          include: {
            farmer: true,
            plot: {
              include: {
                zone: true,
              },
            },
          },
        },
      },
    });

    if (!lot || !warehouseIds.includes(lot.warehouseId)) {
      throw new ForbiddenException(
        'Lô hàng không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    return lot;
  }

  async getProducts(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id);
    return this.prisma.product.findMany({
      where: { adminId, status: 'PUBLISHED' },
      select: { id: true, name: true, sku: true, unit: true },
    });
  }

  async getActiveContracts(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id);
    return this.prisma.contract.findMany({
      where: {
        adminId,
        status: 'ACTIVE',
      },
      include: {
        farmer: { select: { fullName: true } },
        plot: { select: { plotCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactions(
    currentUser: InventoryUser,
    filters: {
      warehouseId?: string;
      type?: string;
      productId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
    );

    const where: any = {
      warehouseId: { in: warehouseIds.length > 0 ? warehouseIds : ['NONE'] },
    };

    if (filters.warehouseId) {
      if (!warehouseIds.includes(filters.warehouseId)) {
        throw new ForbiddenException('Bạn không có quyền truy cập kho này');
      }
      where.warehouseId = filters.warehouseId;
    }

    if (filters.type) where.type = filters.type;
    if (filters.productId) where.productId = filters.productId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    return this.prisma.warehouseTransaction.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true, unit: true } },
        inventoryLot: { select: { id: true, qualityGrade: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTransaction(currentUser: InventoryUser, data: any) {
    const adminId = await this.resolveAdminId(currentUser.id);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
    );

    const warehouseId = data.warehouseId as string;
    const productId = data.productId as string;
    const inventoryLotId = data.inventoryLotId as string;
    const type = data.type as string; // inbound | outbound | adjustment
    const qtyInput = Number(data.quantityKg);
    const note = (data.note as string) || '';

    if (!warehouseIds.includes(warehouseId)) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên kho này');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra sự tồn tại của lô hàng và tính hợp lệ
      const lot = await tx.inventoryLot.findUnique({
        where: { id: inventoryLotId },
      });

      if (!lot || lot.warehouseId !== warehouseId) {
        throw new Error('Lô hàng không tồn tại trong kho đã chọn');
      }

      if (lot.productId !== productId) {
        throw new Error('Sản phẩm không khớp với lô hàng đã chọn');
      }

      // Xác định delta cho việc cộng dồn stock
      let delta = 0;
      let signedQty = qtyInput;

      if (type === 'inbound') {
        delta = qtyInput;
        signedQty = qtyInput;
      } else if (type === 'outbound') {
        if (lot.quantityKg < qtyInput) {
          throw new Error('Số lượng tồn trong lô không đủ để xuất kho');
        }
        delta = -qtyInput;
        signedQty = -qtyInput;
      } else if (type === 'adjustment') {
        delta = qtyInput; // Với adjustment, qtyInput có thể âm hoặc dương (là delta)
        signedQty = qtyInput;
      } else {
        throw new Error('Loại giao dịch không hợp lệ');
      }

      // 2. Tạo giao dịch (signed quantity)
      const transaction = await tx.warehouseTransaction.create({
        data: {
          warehouseId,
          productId,
          inventoryLotId,
          type,
          quantityKg: signedQty,
          note,
          createdBy: currentUser.id,
        },
      });

      // 3. Cập nhật số lượng trong Lô hàng
      await tx.inventoryLot.update({
        where: { id: inventoryLotId },
        data: {
          quantityKg: { increment: delta },
        },
      });

      // 4. Cập nhật tổng tồn kho của Sản phẩm
      await tx.product.update({
        where: { id: productId },
        data: {
          stockKg: { increment: delta },
        },
      });

      return transaction;
    });
  }
}
