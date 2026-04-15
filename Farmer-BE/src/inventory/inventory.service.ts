import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

interface InventoryUser {
  id: string;
  role: Role;
}

interface DashboardData {
  totalStockKg: number;
  pendingOrders: number;
  expiringLots: number;
  stagnantLots: number;
  recentTransactions: {
    id: string;
    warehouseId: string;
    productId: string;
    inventoryLotId: string;
    type: string;
    quantityKg: number;
    note: string | null;
    createdBy: string;
    createdAt: Date;
    warehouse: { id: string; name: string };
    product: { id: string; name: string };
  }[];
  pendingOrdersList: {
    id: string;
    orderCode: string;
    total: number;
    fulfillStatus: string;
    paymentStatus: string;
    orderedAt: Date;
    client: { user: { fullName: string } } | null;
    shippingAddrText: string | null;
  }[];
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
    const inventoryProfileId =
      await this.resolveInventoryProfileId(currentUser.id);

    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId);

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for KPIs
    const [totalStockResult, pendingOrdersCount, expiringLotsCount, stagnantLotsResult, recentTransactions, pendingOrdersList] =
      await Promise.all([
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
          where: warehouseIds.length > 0
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
            warehouseId: { in: warehouseIds.length > 0 ? warehouseIds : ['IMPOSSIBLE'] },
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
    const inventoryProfileId =
      await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
}