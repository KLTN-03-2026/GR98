import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, QualityGrade, ReportStatus, ReportType, ContractStatus } from '@prisma/client';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateTransactionDto, TransactionType } from './dto/create-transaction.dto';
import { CreateInventoryLotDto } from './dto/create-inventory-lot.dto';
import { UpdateLotGradeDto } from './dto/update-lot-grade.dto';
import { ReceiveHarvestDto } from './dto/receive-harvest.dto';

interface InventoryUser {
  id: string;
  role: Role;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) { }

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
      lotCount: w._count.inventoryLots,
      createdAt: w.createdAt,
      managedBy: w.managedBy,
      managerFullName: w.inventory?.user.fullName ?? null,
      managerEmployeeCode: w.inventory?.employeeCode ?? null,
    };
  }

  // ===========================================================================
  // DASHBOARD & ANALYTICS
  // ===========================================================================

  async getDashboard(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalStockResult, pendingOrdersCount, expiringLotsCount, stagnantLotsResult, recentTransactions, pendingOrdersList] = await Promise.all([
      warehouseIds.length > 0
        ? this.prisma.inventoryLot.aggregate({
          where: { 
            warehouseId: { in: warehouseIds },
            harvestDate: { lte: now } // Chỉ tính lô đã đến ngày thu hoạch
          },
          _sum: { quantityKg: true },
        })
        : { _sum: { quantityKg: null } },
      this.prisma.order.count({
        where: { adminId, fulfillStatus: 'PENDING', paymentStatus: { in: ['PENDING', 'PAID'] } },
      }),
      warehouseIds.length > 0
        ? this.prisma.inventoryLot.count({
          where: { warehouseId: { in: warehouseIds }, expiryDate: { lte: sevenDaysLater } },
        })
        : 0,
      this.prisma.inventoryLot.count({
        where: warehouseIds.length > 0
          ? {
            warehouseId: { in: warehouseIds },
            createdAt: { lte: thirtyDaysAgo },
            NOT: { transactions: { some: { type: 'outbound', createdAt: { gte: thirtyDaysAgo } } } },
          }
          : { warehouseId: 'IMPOSSIBLE' },
      }),
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
      this.prisma.order.findMany({
        where: { adminId, fulfillStatus: 'PENDING', paymentStatus: { in: ['PENDING', 'PAID'] } },
        orderBy: { orderedAt: 'desc' },
        take: 10,
        include: { client: { select: { user: { select: { fullName: true } } } } },
      }),
    ]);

    return {
      totalStockKg: totalStockResult._sum.quantityKg ?? 0,
      pendingOrders: pendingOrdersCount,
      expiringLots: expiringLotsCount,
      stagnantLots: stagnantLotsResult,
      recentTransactions,
      pendingOrdersList,
    };
  }

  async getChartData(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

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

      labels.push(dayStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));

      if (warehouseIds.length === 0) {
        inbound.push(0); outbound.push(0); adjustment.push(0); continue;
      }

      const [inRes, outRes, adjRes] = await Promise.all([
        this.prisma.warehouseTransaction.aggregate({
          where: { warehouseId: { in: warehouseIds }, type: 'inbound', createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { quantityKg: true },
        }),
        this.prisma.warehouseTransaction.aggregate({
          where: { warehouseId: { in: warehouseIds }, type: 'outbound', createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { quantityKg: true },
        }),
        this.prisma.warehouseTransaction.aggregate({
          where: { warehouseId: { in: warehouseIds }, type: 'adjustment', createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { quantityKg: true },
        }),
      ]);
      inbound.push(inRes._sum.quantityKg ?? 0);
      outbound.push(outRes._sum.quantityKg ?? 0);
      adjustment.push(adjRes._sum.quantityKg ?? 0);
    }
    return { labels, inbound, outbound, adjustment };
  }

  // ===========================================================================
  // WAREHOUSES
  // ===========================================================================

  async getWarehouses(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);

    const where = currentUser.role === Role.ADMIN
      ? { adminId }
      : inventoryProfileId
        ? { adminId, managedBy: inventoryProfileId, isActive: true }
        : { adminId, isActive: true };

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      include: {
        _count: { select: { inventoryLots: true } },
        inventory: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return warehouses.map((w) => this.mapWarehouseListItem(w));
  }

  async getWarehouseById(id: string, currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventory: { select: { id: true, employeeCode: true, user: { select: { fullName: true, email: true } } } },
        inventoryLots: {
          include: { product: { select: { id: true, name: true, sku: true, unit: true } } },
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          include: { product: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!warehouse || warehouse.adminId !== adminId) {
      throw new ForbiddenException('Kho hàng không tồn tại hoặc bạn không có quyền truy cập');
    }
    return warehouse;
  }

  async createWarehouse(currentUser: InventoryUser, dto: CreateWarehouseDto) {
    if (currentUser.role !== Role.ADMIN) throw new ForbiddenException('Chỉ quản trị viên được tạo kho');
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    await this.assertManagedByBelongsToAdmin(adminId, dto.managedBy);

    const created = await this.prisma.warehouse.create({
      data: {
        name: dto.name.trim(),
        locationAddress: dto.locationAddress?.trim() || null,
        isActive: dto.isActive ?? true,
        managedBy: dto.managedBy || null,
        adminId,
      },
      include: {
        _count: { select: { inventoryLots: true } },
        inventory: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } },
      },
    });
    return this.mapWarehouseListItem(created);
  }

  async updateWarehouse(id: string, currentUser: InventoryUser, dto: UpdateWarehouseDto) {
    if (currentUser.role !== Role.ADMIN) throw new ForbiddenException('Chỉ quản trị viên được cập nhật kho');
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        locationAddress: dto.locationAddress?.trim(),
        isActive: dto.isActive,
        managedBy: dto.managedBy,
      },
      include: {
        _count: { select: { inventoryLots: true } },
        inventory: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } },
      },
    });
    return this.mapWarehouseListItem(updated);
  }

  // ===========================================================================
  // INVENTORY LOTS (STAGE 2)
  // ===========================================================================

  async getLots(currentUser: InventoryUser, filters: { warehouseId?: string; productId?: string; qualityGrade?: string }) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

    const where: any = {
      warehouseId: { in: warehouseIds.length > 0 ? warehouseIds : ['NONE'] },
    };
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.qualityGrade) where.qualityGrade = filters.qualityGrade;

    const lots = await this.prisma.inventoryLot.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, locationAddress: true } },
        product: { select: { id: true, name: true, sku: true, unit: true } },
        contract: {
          select: {
            id: true,
            contractNo: true,
            farmer: { select: { fullName: true, phone: true } },
            plot: {
              select: {
                plotCode: true,
                zone: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    // Tính toán số dư thực tế cho từng lô tại kho được chọn
    // Nếu không chọn warehouseId cụ thể, lấy số dư tại kho mặc định của nó
    return Promise.all(
      lots.map(async (lot) => {
        const targetWarehouseId = filters.warehouseId || lot.warehouseId;
        const aggregate = await this.prisma.warehouseTransaction.aggregate({
          where: {
            inventoryLotId: lot.id,
            warehouseId: targetWarehouseId,
          },
          _sum: { quantityKg: true },
        });

        // Xác định trạng thái ảo dựa trên harvestDate
        const isUpcoming = lot.harvestDate && lot.harvestDate > now;

        return {
          ...lot,
          quantityKg: aggregate._sum.quantityKg || 0,
          isUpcoming,
          statusLabel: isUpcoming ? 'Dự kiến' : 'Trong kho',
        };
      }),
    );
  }

  async getLotTimeline(currentUser: InventoryUser, lotId: string) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

    // Kiểm tra xem lô hàng có thuộc quyền quản lý của user không
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id: lotId },
      select: { warehouseId: true },
    });

    if (!lot || (currentUser.role === Role.INVENTORY && !warehouseIds.includes(lot.warehouseId))) {
      throw new ForbiddenException('Bạn không có quyền truy cập thông tin lô hàng này');
    }

    return this.prisma.warehouseTransaction.findMany({
      where: { inventoryLotId: lotId },
      include: {
        warehouse: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLot(currentUser: InventoryUser, dto: CreateInventoryLotDto) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.inventoryLot.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          contractId: dto.contractId || null,
          quantityKg: dto.quantityKg,
          qualityGrade: dto.qualityGrade,
          harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        },
      });

      await tx.warehouseTransaction.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          inventoryLotId: lot.id,
          type: 'receive',
          quantityKg: dto.quantityKg,
          note: dto.deviationReason || dto.note || 'Nhập lô hàng mới',
          createdBy: currentUser.id,
        },
      });

      // Nếu có reportId, cập nhật trạng thái báo cáo thu hoạch sang REVIEWED
      if (dto.reportId) {
        await tx.dailyReport.update({
          where: { id: dto.reportId },
          data: { status: 'REVIEWED' },
        });
      }

      return lot;
    });
  }

  async receiveHarvest(currentUser: InventoryUser, dto: ReceiveHarvestDto) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

    if (!warehouseIds.includes(dto.warehouseId)) {
      throw new ForbiddenException('Bạn không có quyền nhập hàng vào kho này');
    }

    const { dailyReportId, contractId, warehouseId, actualWeight, qualityGrade, justification, note } = dto;

    // 1. Fetch Daily Report and Contract for validation
    const [report, contract] = await Promise.all([
      this.prisma.dailyReport.findUnique({
        where: { id: dailyReportId },
        select: { id: true, yieldEstimateKg: true, adminId: true, status: true, plotId: true }
      }),
      this.prisma.contract.findUnique({
        where: { id: contractId },
        select: { id: true, adminId: true, status: true, product: { select: { id: true } } }
      })
    ]);

    if (!report || report.adminId !== adminId) {
      throw new NotFoundException('Báo cáo thực địa không tồn tại');
    }

    if (!contract || contract.adminId !== adminId) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }

    if (!contract.product) {
      throw new BadRequestException('Hợp đồng này chưa được liên kết với sản phẩm thương mại');
    }

    // 2. Tolerance Logic (5%)
    if (report.yieldEstimateKg) {
      const estimate = report.yieldEstimateKg;
      const deviation = Math.abs(actualWeight - estimate) / estimate;

      if (deviation > 0.05 && !justification) {
        throw new BadRequestException({
          code: 'DISCREPANCY_EXCEEDED',
          message: `Sản lượng thực tế (${actualWeight}kg) lệch >5% so với dự báo (${estimate}kg). Vui lòng nhập lý do giải trình.`,
          deviation: (deviation * 100).toFixed(2),
        });
      }
    }

    // 3. Atomic Transaction
    return this.prisma.$transaction(async (tx) => {
      // A. Create the Inventory Lot
      const lot = await tx.inventoryLot.create({
        data: {
          warehouseId,
          productId: contract.product!.id,
          contractId,
          quantityKg: actualWeight,
          qualityGrade,
          harvestDate: new Date(),
        },
      });

      // B. Create Inbound Transaction Log
      const transactionNote = justification
        ? `[ĐỐI SOÁT] Lệch >5%. Lý do: ${justification}. ${note || ''}`
        : `Nhận hàng từ thực địa. ${note || ''}`;

      await tx.warehouseTransaction.create({
        data: {
          warehouseId,
          productId: contract.product!.id,
          inventoryLotId: lot.id,
          type: 'inbound',
          quantityKg: actualWeight,
          note: transactionNote,
          createdBy: currentUser.id,
        },
      });

      // C. Update Product stockKg
      await tx.product.update({
        where: { id: contract.product!.id },
        data: {
          stockKg: { increment: actualWeight },
        },
      });

      // D. Update Daily Report Status
      await tx.dailyReport.update({
        where: { id: dailyReportId },
        data: { status: 'REVIEWED' }
      });

      return lot;
    });
  }

  async getLotById(id: string, currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id },
      include: { warehouse: true, product: true, contract: { include: { farmer: true } }, transactions: true },
    });
    if (!lot || lot.warehouse.adminId !== adminId) throw new NotFoundException('Không tìm thấy lô hàng');
    return lot;
  }

  async updateLotGrade(id: string, currentUser: InventoryUser, dto: UpdateLotGradeDto) {
    return this.prisma.inventoryLot.update({
      where: { id },
      data: { qualityGrade: dto.qualityGrade },
    });
  }

  // ===========================================================================
  // TRANSACTIONS (STAGE 3 & 4)
  // ===========================================================================

  async getTransactions(currentUser: InventoryUser, filters: any) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

    return this.prisma.warehouseTransaction.findMany({
      where: { warehouseId: { in: warehouseIds } },
      include: {
        warehouse: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true, unit: true } },
        inventoryLot: { select: { id: true, qualityGrade: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTransaction(currentUser: InventoryUser, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.inventoryLot.findUnique({ where: { id: dto.inventoryLotId } });
      if (!lot) throw new BadRequestException('Lô hàng không tồn tại');

      const now = new Date();
      if (dto.type === TransactionType.OUTBOUND && lot.harvestDate && lot.harvestDate > now) {
        throw new BadRequestException('Không thể xuất kho lô hàng chưa nhập kho thực tế (hàng sắp về)');
      }

      // 1. Tính toán số dư thực tế của lô tại kho xuất
      const aggregate = await tx.warehouseTransaction.aggregate({
        where: {
          inventoryLotId: dto.inventoryLotId,
          warehouseId: dto.warehouseId,
        },
        _sum: { quantityKg: true },
      });
      const currentLotBalance = aggregate._sum.quantityKg || 0;

      let delta = 0; // Biến động cho Kho xuất
      let stockDelta = 0; // Biến động cho Product stockKg (Kho tổng hệ thống)

      if (dto.type === TransactionType.INBOUND) {
        delta = dto.quantityKg;
        stockDelta = dto.quantityKg;
      } else if (dto.type === TransactionType.OUTBOUND) {
        if (currentLotBalance < dto.quantityKg) {
          throw new BadRequestException(`Lô hàng tại kho này không đủ số lượng (Hiện còn: ${currentLotBalance}kg)`);
        }
        delta = -dto.quantityKg;
        stockDelta = dto.isTransfer ? 0 : -dto.quantityKg; // Nếu điều chuyển thì kho tổng không đổi
      } else if (dto.type === TransactionType.ADJUSTMENT) {
        // Adjustment tính dựa trên chênh lệch với số dư thực tế
        delta = dto.quantityKg - currentLotBalance;
        stockDelta = delta;
      }

      // 2. Tạo bản ghi giao dịch cho kho xuất
      const transaction = await tx.warehouseTransaction.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          inventoryLotId: dto.inventoryLotId,
          type: dto.type,
          quantityKg: delta,
          note: dto.note || '',
          createdBy: currentUser.id,
        },
      });

      // 3. Nếu là điều chuyển, tạo bản ghi nhập cho kho nhận
      if (dto.isTransfer && dto.targetWarehouseId) {
        if (dto.targetWarehouseId === dto.warehouseId) {
          throw new BadRequestException('Kho nhận phải khác kho xuất');
        }
        await tx.warehouseTransaction.create({
          data: {
            warehouseId: dto.targetWarehouseId,
            productId: dto.productId,
            inventoryLotId: dto.inventoryLotId,
            type: TransactionType.INBOUND,
            quantityKg: dto.quantityKg,
            note: `[ĐIỀU CHUYỂN] Từ kho ${dto.warehouseId}. ${dto.note || ''}`,
            createdBy: currentUser.id,
          },
        });
      }

      // 4. Cập nhật kho tổng Product (chỉ khi có biến động hệ thống)
      if (stockDelta !== 0) {
        await tx.product.update({
          where: { id: dto.productId },
          data: { stockKg: { increment: stockDelta } },
        });
      }

      // Lưu ý: Chúng ta KHÔNG cập nhật quantityKg trong bảng InventoryLot theo yêu cầu.
      // Tuy nhiên, nếu là giao dịch INBOUND ĐẦU TIÊN của lô hàng mới, ta có thể cần cập nhật để hiển thị.
      // Nhưng theo thiết kế của bạn, ta sẽ dựa hoàn toàn vào bảng WarehouseTransaction để tính toán.

      return transaction;
    });
  }

  // ===========================================================================
  // AUXILIARY (PRODUCTS, CONTRACTS, REPORTS)
  // ===========================================================================

  async getProducts(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const products = await this.prisma.product.findMany({ 
      where: { adminId }, 
      orderBy: { name: 'asc' } 
    });

    const now = new Date();

    return Promise.all(products.map(async (p) => {
      const [actual, upcoming] = await Promise.all([
        this.prisma.inventoryLot.aggregate({
          where: { productId: p.id, harvestDate: { lte: now } },
          _sum: { quantityKg: true }
        }),
        this.prisma.inventoryLot.aggregate({
          where: { productId: p.id, harvestDate: { gt: now } },
          _sum: { quantityKg: true }
        })
      ]);

      return {
        ...p,
        actualStockKg: actual._sum.quantityKg || 0,
        upcomingStockKg: upcoming._sum.quantityKg || 0,
        totalStockKg: (actual._sum.quantityKg || 0) + (upcoming._sum.quantityKg || 0)
      };
    }));
  }

  async getActiveContracts(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    return this.prisma.contract.findMany({
      where: { adminId, status: 'ACTIVE' },
      include: { farmer: { select: { fullName: true } }, plot: { select: { plotCode: true, cropType: true } } },
    });
  }

  async getPendingHarvests(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    return this.prisma.dailyReport.findMany({
      where: { adminId, status: 'SUBMITTED', yieldEstimateKg: { not: null } },
      include: {
        plot: {
          include: {
            farmer: { select: { fullName: true } },
            contracts: {
              where: { status: 'ACTIVE' },
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        supervisor: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async getSupplyDemand(currentUser: InventoryUser, filters: any) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);

    // 1. Lấy sản lượng dự kiến (Cung tương lai)
    const reports = await this.prisma.dailyReport.groupBy({
      by: ['adminId'],
      where: { adminId, status: { in: ['SUBMITTED', 'REVIEWED'] }, yieldEstimateKg: { not: null } },
      _sum: { yieldEstimateKg: true },
    });

    // 2. Lấy tồn kho thực tế (Cung hiện tại)
    const stocks = await this.prisma.inventoryLot.aggregate({
      where: { warehouse: { adminId } },
      _sum: { quantityKg: true },
    });

    // 3. Lấy nhu cầu (Đơn hàng PENDING)
    // Giả sử cropType chung là Gạo ST25 cho demo
    const expectedKg = reports[0]?._sum?.yieldEstimateKg ?? 0;
    const actualStockKg = stocks._sum?.quantityKg ?? 0;

    return {
      items: [
        {
          cropType: 'Gạo ST25',
          expectedKg,
          actualStockKg,
          pendingOrderKg: 0, // Cần mở rộng bảng Order nếu muốn lấy số thật
        },
      ],
    };
  }
}
