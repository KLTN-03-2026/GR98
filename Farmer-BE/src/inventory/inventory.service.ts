import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateTransactionDto, TransactionType } from './dto/create-transaction.dto';
import { CreateInventoryLotDto } from './dto/create-inventory-lot.dto';

interface InventoryUser {
  id: string;
  role: Role;
}
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveAdminId(
    currentUserId: string,
    role: Role,
  ): Promise<string> {
    if (role === Role.ADMIN) {
      const admin = await this.prisma.adminProfile.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });
      if (!admin) {
        throw new ForbiddenException('Không xác định được hồ sơ quản trị');
      }
      return admin.id;
    }

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
    role: Role,
  ): Promise<string[]> {
    if (role === Role.ADMIN) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { adminId },
        select: { id: true },
      });
      return warehouses.map((w) => w.id);
    }

    const where = inventoryProfileId
      ? { adminId, managedBy: inventoryProfileId, isActive: true }
      : { adminId, isActive: true };

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      select: { id: true },
    });

    return warehouses.map((w) => w.id);
  }

  private async assertManagedByBelongsToAdmin(
    adminId: string,
    managedBy: string | null | undefined,
  ): Promise<void> {
    if (managedBy === undefined || managedBy === null || managedBy === '') {
      return;
    }
    const inv = await this.prisma.inventoryProfile.findUnique({
      where: { id: managedBy },
      select: { adminId: true },
    });
    if (!inv || inv.adminId !== adminId) {
      throw new BadRequestException(
        'Nhân viên kho không tồn tại hoặc không thuộc đơn vị của bạn',
      );
    }
  }

  private mapWarehouseListItem(w: {
    id: string;
    name: string;
    locationAddress: string | null;
    isActive: boolean;
    createdAt: Date;
    managedBy: string | null;
    _count: { inventoryLots: number };
    inventory: {
      id: string;
      employeeCode: string;
      user: { fullName: string };
    } | null;
  }) {
    return {
      id: w.id,
      name: w.name,
      locationAddress: w.locationAddress,
      isActive: w.isActive,
      // Số lô hàng kho (InventoryLot), không phải lô đất / không phải số giao dịch
      lotCount: w._count.inventoryLots,
      createdAt: w.createdAt,
      managedBy: w.managedBy,
      managerFullName: w.inventory?.user.fullName ?? null,
      managerEmployeeCode: w.inventory?.employeeCode ?? null,
    };
  }

  async getDashboard(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );

    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
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
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
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
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );

    const where =
      currentUser.role === Role.ADMIN
        ? { adminId }
        : inventoryProfileId
          ? { adminId, managedBy: inventoryProfileId, isActive: true }
          : { adminId, isActive: true };

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: { inventoryLots: true },
        },
        inventory: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return warehouses.map((w) => this.mapWarehouseListItem(w));
  }

  async getWarehouseById(id: string, currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventory: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { fullName: true, email: true } },
          },
        },
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
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
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

  async createLot(currentUser: InventoryUser, dto: CreateInventoryLotDto) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
    );

    if (!warehouseIds.includes(dto.warehouseId)) {
      throw new ForbiddenException('Bạn không có quyền nhập hàng vào kho này');
    }

    const { warehouseId, productId, quantityKg, contractId, note } = dto;
    const notes = note || 'Nhập kho lô hàng mới';

    // RECONCILIATION LOGIC: Check for 5% deviation from Supervisor Estimate
    if (contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        select: { plotId: true },
      });

      if (contract?.plotId) {
        const lastReport = await this.prisma.dailyReport.findFirst({
          where: {
            plotId: contract.plotId,
            status: { in: ['SUBMITTED', 'REVIEWED'] },
            yieldEstimateKg: { not: null },
          },
          orderBy: { reportedAt: 'desc' },
        });

        if (lastReport?.yieldEstimateKg) {
          const estimate = lastReport.yieldEstimateKg;
          const deviation = Math.abs(quantityKg - estimate) / estimate;

          if (deviation > 0.05) {
            throw new BadRequestException(
              `CẢNH BÁO CHÊNH LỆCH: Sản lượng nhập kho (${quantityKg}kg) sai lệch >5% so với dự báo của Giám sát viên (${estimate}kg). Vui lòng kiểm tra lại với GSV trước khi nhập kho.`,
            );
          }
        }
      }
    }

    // Transactional creation
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Lot
      const lot = await tx.inventoryLot.create({
        data: {
          warehouseId,
          productId,
          contractId,
          quantityKg,
          harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          qualityGrade: dto.qualityGrade,
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
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
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
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    return this.prisma.product.findMany({
      where: { adminId, status: 'PUBLISHED' },
      select: { id: true, name: true, sku: true, unit: true },
    });
  }

  async getActiveContracts(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
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
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
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

  async createTransaction(currentUser: InventoryUser, dto: CreateTransactionDto) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
    );

    const { warehouseId, productId, inventoryLotId, type, quantityKg, note } =
      dto;

    if (!warehouseIds.includes(warehouseId)) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên kho này');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra sự tồn tại của lô hàng và tính hợp lệ
      const lot = await tx.inventoryLot.findUnique({
        where: { id: inventoryLotId },
      });

      if (!lot || lot.warehouseId !== warehouseId) {
        throw new BadRequestException('Lô hàng không tồn tại trong kho đã chọn');
      }

      if (lot.productId !== productId) {
        throw new BadRequestException('Sản phẩm không khớp với lô hàng đã chọn');
      }

      // Xác định delta cho việc cộng dồn stock
      let delta = 0;
      let signedQty = quantityKg;

      if (type === TransactionType.INBOUND) {
        delta = quantityKg;
        signedQty = quantityKg;
      } else if (type === TransactionType.OUTBOUND) {
        if (lot.quantityKg < quantityKg) {
          throw new BadRequestException(
            `Số lượng tồn trong lô không đủ để xuất kho (Hiện có: ${lot.quantityKg}kg)`,
          );
        }
        delta = -quantityKg;
        signedQty = -quantityKg;
      } else if (type === TransactionType.ADJUSTMENT) {
        // Với adjustment, quantityKg có thể dương (tăng) hoặc âm (giảm)
        delta = quantityKg;
        signedQty = quantityKg;
      }

      // 2. Tạo giao dịch (signed quantity)
      const transaction = await tx.warehouseTransaction.create({
        data: {
          warehouseId,
          productId,
          inventoryLotId,
          type,
          quantityKg: signedQty,
          note: note || '',
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

  async getSupplyDemand(
    currentUser: InventoryUser,
    filters: { cropType?: string; fromDate?: string; toDate?: string },
  ) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(
      currentUser.id,
    );
    const warehouseIds = await this.getWarehouseIds(
      adminId,
      inventoryProfileId,
      currentUser.role,
    );

    const cropType = filters.cropType || undefined;
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : undefined;
    const toDate = filters.toDate ? new Date(filters.toDate) : undefined;

    // 1. Fetch Expected Yield from DailyReports (yieldEstimateKg)
    const dailyReports = await this.prisma.dailyReport.findMany({
      where: {
        adminId,
        status: { in: ['SUBMITTED', 'REVIEWED'] },
        yieldEstimateKg: { not: null },
        plot: cropType ? { cropType } : {},
        ...(fromDate && { reportedAt: { gte: fromDate } }),
        ...(toDate && { reportedAt: { lte: toDate } }),
      },
      include: { plot: { select: { cropType: true } } },
    });

    // 2. Fetch Actual Stock from InventoryLot (within managed warehouses)
    const inventoryLots = await this.prisma.inventoryLot.findMany({
      where: {
        warehouseId: { in: warehouseIds.length > 0 ? warehouseIds : ['NONE'] },
        product: cropType ? { cropType } : {},
      },
      include: { product: { select: { cropType: true } } },
    });

    // 3. Fetch Demand from Pending/Packing Orders
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        adminId,
        fulfillStatus: { in: ['PENDING', 'PACKING'] },
        orderItems: cropType ? { some: { product: { cropType } } } : undefined,
      },
      include: {
        orderItems: {
          include: { product: { select: { cropType: true } } },
        },
      },
    });

    // Aggregation Logic
    const summary: Record<
      string,
      { expected: number; stock: number; pending: number }
    > = {};

    dailyReports.forEach((r) => {
      const type = r.plot.cropType;
      if (!summary[type]) summary[type] = { expected: 0, stock: 0, pending: 0 };
      summary[type].expected += r.yieldEstimateKg || 0;
    });

    inventoryLots.forEach((l) => {
      const type = l.product.cropType;
      if (!summary[type]) summary[type] = { expected: 0, stock: 0, pending: 0 };
      summary[type].stock += l.quantityKg;
    });

    pendingOrders.forEach((o) => {
      o.orderItems.forEach((item) => {
        const type = item.product.cropType;
        // Filter by cropType if provided
        if (filters.cropType && type !== filters.cropType) return;

        if (!summary[type])
          summary[type] = { expected: 0, stock: 0, pending: 0 };
        summary[type].pending += item.quantityKg;
      });
    });

    const items = Object.entries(summary).map(([cropType, data]) => ({
      cropType,
      expectedKg: data.expected,
      actualStockKg: data.stock,
      pendingOrderKg: data.pending,
    }));

    return {
      items,
      chartData: {
        labels: items.map((i) => i.cropType),
        expected: items.map((i) => i.expectedKg),
        stock: items.map((i) => i.actualStockKg),
        pending: items.map((i) => i.pendingOrderKg),
      },
    };
  }

  async createWarehouse(currentUser: InventoryUser, dto: CreateWarehouseDto) {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ quản trị viên được tạo kho');
    }
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    await this.assertManagedByBelongsToAdmin(adminId, dto.managedBy);

    const managedBy =
      dto.managedBy === undefined ||
      dto.managedBy === '' ||
      dto.managedBy === null
        ? null
        : dto.managedBy;

    const created = await this.prisma.warehouse.create({
      data: {
        name: dto.name.trim(),
        locationAddress: dto.locationAddress?.trim() || null,
        isActive: dto.isActive ?? true,
        managedBy,
        adminId,
      },
      include: {
        _count: { select: { inventoryLots: true } },
        inventory: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return this.mapWarehouseListItem(created);
  }

  async updateWarehouse(
    id: string,
    currentUser: InventoryUser,
    dto: UpdateWarehouseDto,
  ) {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ quản trị viên được cập nhật kho');
    }
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);

    const existing = await this.prisma.warehouse.findUnique({
      where: { id },
      select: { id: true, adminId: true },
    });
    if (!existing || existing.adminId !== adminId) {
      throw new NotFoundException('Không tìm thấy kho hàng');
    }

    if (dto.managedBy !== undefined) {
      await this.assertManagedByBelongsToAdmin(adminId, dto.managedBy);
    }

    const data: {
      name?: string;
      locationAddress?: string | null;
      isActive?: boolean;
      managedBy?: string | null;
    } = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.locationAddress !== undefined) {
      data.locationAddress = dto.locationAddress?.trim() || null;
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.managedBy !== undefined) {
      data.managedBy =
        dto.managedBy === '' || dto.managedBy === null ? null : dto.managedBy;
    }

    if (Object.keys(data).length === 0) {
      const row = await this.prisma.warehouse.findUnique({
        where: { id },
        include: {
          _count: { select: { inventoryLots: true } },
          inventory: {
            select: {
              id: true,
              employeeCode: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });
      if (!row) {
        throw new NotFoundException('Không tìm thấy kho hàng');
      }
      return this.mapWarehouseListItem(row);
    }

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data,
      include: {
        _count: { select: { inventoryLots: true } },
        inventory: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return this.mapWarehouseListItem(updated);
  }
}
