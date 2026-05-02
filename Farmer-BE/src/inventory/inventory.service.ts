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
import { UpdateInventoryLotDto } from './dto/update-inventory-lot.dto';

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

  async getLots(
    currentUser: InventoryUser,
    filters: {
      warehouseId?: string;
      productId?: string;
      qualityGrade?: string;
      status?: string;         // 'upcoming' | 'in-stock' | 'empty'
      expiryStatus?: string;   // 'expiring-soon' | 'expired'
      contractId?: string;
    },
  ) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

    const now = new Date();

    const where: any = {
      warehouseId: { in: warehouseIds.length > 0 ? warehouseIds : ['NONE'] },
    };

    // --- Nhóm Lọc Theo Nguồn Gốc & Vị Trí ---
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.contractId) where.contractId = filters.contractId;

    // --- Nhóm Lọc Theo Chất Lượng ---
    if (filters.qualityGrade) where.qualityGrade = filters.qualityGrade;

    // --- Nhóm Lọc Theo Trạng Thái Vận Hành (harvestDate) ---
    if (filters.status === 'upcoming') {
      where.harvestDate = { gt: now };
    } else if (filters.status === 'in-stock') {
      where.harvestDate = { lte: now };
    }
    // 'empty' sẽ được lọc sau khi tính toán quantityKg thực tế

    // --- Nhóm Lọc Theo Rủi Ro Hết Hạn ---
    if (filters.expiryStatus === 'expired') {
      where.expiryDate = { lt: now };
    } else if (filters.expiryStatus === 'expiring-soon') {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.expiryDate = { gte: now, lte: sevenDaysLater };
    }

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

    // Tính toán số dư thực tế cho từng lô
    const enrichedLots = await Promise.all(
      lots.map(async (lot) => {
        const targetWarehouseId = filters.warehouseId || lot.warehouseId;
        const aggregate = await this.prisma.warehouseTransaction.aggregate({
          where: {
            inventoryLotId: lot.id,
            warehouseId: targetWarehouseId,
          },
          _sum: { quantityKg: true },
        });

        const isUpcoming = lot.status === 'SCHEDULED' || (lot.harvestDate && lot.harvestDate > now);
        
        // Logic tính toán số lượng:
        // - Nếu là hàng Sắp về/Chờ nhập: Lấy số lượng dự tính từ field quantityKg trong DB
        // - Nếu là hàng Đã vào kho: Tính toán dựa trên các giao dịch thực tế (Transactions)
        const quantityKg = (lot.status === 'SCHEDULED' || lot.status === 'ARRIVED')
          ? lot.quantityKg
          : (aggregate._sum.quantityKg || 0);

        // Tính trạng thái hết hạn
        const isExpired = lot.expiryDate && new Date(lot.expiryDate) < now;
        const isExpiringSoon = lot.expiryDate && !isExpired
          && new Date(lot.expiryDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return {
          ...lot,
          quantityKg,
          isUpcoming,
          isExpired,
          isExpiringSoon,
          statusLabel: isUpcoming ? 'Dự kiến' : quantityKg <= 0 ? 'Đã hết' : 'Trong kho',
        };
      }),
    );

    // Lọc hậu xử lý cho trạng thái 'empty' (cần quantityKg đã tính)
    if (filters.status === 'empty') {
      return enrichedLots.filter((lot) => lot.quantityKg <= 0);
    }

    return enrichedLots;
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
      const harvestDate = dto.harvestDate ? new Date(dto.harvestDate) : null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const lotStatus = harvestDate && harvestDate > now ? 'SCHEDULED' : 'ARRIVED';

      const lot = await tx.inventoryLot.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          contractId: dto.contractId || null,
          quantityKg: dto.quantityKg,
          qualityGrade: dto.qualityGrade,
          harvestDate: harvestDate,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          status: lotStatus,
        },
      });

      // Ghi log khởi tạo lô hàng vào Timeline
      await tx.warehouseTransaction.create({
        data: {
          warehouseId: lot.warehouseId,
          productId: lot.productId,
          inventoryLotId: lot.id,
          type: 'adjustment',
          quantityKg: 0,
          note: `[KHỞI TẠO] Lô hàng được tạo thủ công. Trạng thái: ${lotStatus === 'SCHEDULED' ? 'Dự kiến' : 'Chờ xác nhận'}.`,
          createdBy: currentUser.id,
        }
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
      // A. Create the Inventory Lot - Giai đoạn ARRIVED (Chờ kho xác nhận)
      const lot = await tx.inventoryLot.create({
        data: {
          warehouseId,
          productId: contract.product!.id,
          contractId,
          quantityKg: actualWeight,
          qualityGrade,
          harvestDate: new Date(),
          status: 'ARRIVED',
        },
      });

      // Ghi log thông báo hàng từ thực địa về kho
      await tx.warehouseTransaction.create({
        data: {
          warehouseId,
          productId: contract.product!.id,
          inventoryLotId: lot.id,
          type: 'adjustment',
          quantityKg: 0,
          note: `[THÔNG BÁO] Hàng từ thực địa về kho. Trạng thái: Chờ xác nhận. ${justification ? 'Lý do chênh lệch: ' + justification : ''}`,
          createdBy: currentUser.id,
        }
      });

      // B. Update Daily Report Status
      await tx.dailyReport.update({
        where: { id: dailyReportId },
        data: { status: 'REVIEWED' }
      });

      return lot;
    });
  }

  async confirmReceipt(currentUser: InventoryUser, lotId: string, actualWeight: number, note?: string) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.inventoryLot.findUnique({
        where: { id: lotId },
        include: { product: true }
      });

      if (!lot) throw new NotFoundException('Không tìm thấy lô hàng');
      if (lot.status === 'RECEIVED') throw new BadRequestException('Lô hàng này đã được nhập kho trước đó');

      // 1. Cập nhật lô hàng sang RECEIVED
      const updatedLot = await tx.inventoryLot.update({
        where: { id: lotId },
        data: {
          status: 'RECEIVED',
          quantityKg: actualWeight, // Cập nhật khối lượng thực nhập
        }
      });

      // 2. Tạo bản ghi giao dịch kho (Transaction)
      await tx.warehouseTransaction.create({
        data: {
          warehouseId: lot.warehouseId,
          productId: lot.productId,
          inventoryLotId: lot.id,
          type: 'inbound',
          quantityKg: actualWeight,
          note: note || 'Xác nhận nhập kho thực tế',
          createdBy: currentUser.id,
        }
      });

      // 3. Cập nhật tồn kho sản phẩm (stockKg)
      await tx.product.update({
        where: { id: lot.productId },
        data: {
          stockKg: { increment: actualWeight }
        }
      });

      return updatedLot;
    });
  }

  async rejectLot(lotId: string, currentUser: InventoryUser, reason: string) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.inventoryLot.findUnique({
        where: { id: lotId },
        include: { warehouse: true }
      });

      if (!lot || lot.warehouse.adminId !== adminId) {
        throw new NotFoundException('Không tìm thấy lô hàng');
      }

      if (lot.status !== 'ARRIVED' && lot.status !== 'SCHEDULED') {
        throw new BadRequestException('Chỉ có thể từ chối lô hàng đang chờ nhập kho hoặc sắp về');
      }

      const updatedLot = await tx.inventoryLot.update({
        where: { id: lotId },
        data: {
          status: 'REJECTED',
          rejectedReason: reason,
        }
      });

      // Ghi log vào giao dịch kho (loại adjustment với số lượng 0 để làm timeline)
      await tx.warehouseTransaction.create({
        data: {
          warehouseId: lot.warehouseId,
          productId: lot.productId,
          inventoryLotId: lot.id,
          type: 'adjustment',
          quantityKg: 0,
          note: `[TỪ CHỐI LÔ HÀNG] Lý do: ${reason}`,
          createdBy: currentUser.id,
        }
      });

      return updatedLot;
    });
  }

  async getLotById(id: string, currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id },
      include: {
        warehouse: true,
        product: true,
        contract: {
          include: {
            farmer: true,
            plot: {
              include: { zone: true }
            }
          }
        },
        transactions: true
      },
    });
    if (!lot || lot.warehouse.adminId !== adminId) throw new NotFoundException('Không tìm thấy lô hàng');

    const now = new Date();
    const isUpcoming = lot.harvestDate && lot.harvestDate > now;

    return {
      ...lot,
      isUpcoming,
      statusLabel: isUpcoming ? 'Dự kiến' : 'Trong kho',
    };
  }

  async updateLotGrade(id: string, currentUser: InventoryUser, dto: UpdateLotGradeDto) {
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id },
      select: { status: true }
    });

    if ((lot?.status === 'RECEIVED' || lot?.status === 'ARRIVED') && dto.qualityGrade === 'REJECT') {
      throw new BadRequestException('Không thể sử dụng phẩm cấp REJECT. Vui lòng sử dụng chức năng "Từ chối lô hàng" để xử lý các lô hàng không đạt yêu cầu.');
    }

    return this.prisma.inventoryLot.update({
      where: { id },
      data: { qualityGrade: dto.qualityGrade },
    });
  }

  async updateLot(id: string, currentUser: InventoryUser, dto: UpdateInventoryLotDto) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);

    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id },
      include: { warehouse: true },
    });

    if (!lot || lot.warehouse.adminId !== adminId) {
      throw new NotFoundException('Không tìm thấy lô hàng hoặc bạn không có quyền chỉnh sửa');
    }

    if ((lot.status === 'RECEIVED' || lot.status === 'ARRIVED') && dto.qualityGrade === 'REJECT') {
      throw new BadRequestException('Không thể sử dụng phẩm cấp REJECT. Vui lòng sử dụng chức năng "Từ chối lô hàng" để xử lý các lô hàng không đạt yêu cầu.');
    }

    const now = new Date();
    if (lot.harvestDate && lot.harvestDate > now) {
      throw new BadRequestException('Không thể cập nhật thông tin cho lô hàng chưa về kho (dự kiến)');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật Lot
      const updatedLot = await tx.inventoryLot.update({
        where: { id },
        data: {
          qualityGrade: dto.qualityGrade,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
        },
      });

      // 2. Nếu có thay đổi phẩm cấp, ghi log vào Timeline
      if (dto.qualityGrade && dto.qualityGrade !== lot.qualityGrade) {
        await tx.warehouseTransaction.create({
          data: {
            warehouseId: lot.warehouseId,
            productId: lot.productId,
            inventoryLotId: lot.id,
            type: 'adjustment',
            quantityKg: 0,
            note: `[CẬP NHẬT PHẨM CẤP] Thay đổi từ Loại ${lot.qualityGrade} sang Loại ${dto.qualityGrade}. ${dto.reason || ''}`,
            createdBy: currentUser.id,
          },
        });
      }

      // 3. Nếu có thay đổi ngày hết hạn, ghi log
      if (dto.expiryDate) {
        const newExpiry = new Date(dto.expiryDate);
        const oldExpiry = lot.expiryDate ? new Date(lot.expiryDate) : null;

        // Kiểm tra logic: Hết hạn phải sau thu hoạch
        if (lot.harvestDate && newExpiry < new Date(lot.harvestDate)) {
          throw new BadRequestException('Ngày hết hạn không thể trước ngày thu hoạch');
        }

        if (!oldExpiry || newExpiry.getTime() !== oldExpiry.getTime()) {
          const oldLabel = oldExpiry ? oldExpiry.toLocaleDateString('vi-VN') : 'Chưa thiết lập';
          const newLabel = newExpiry.toLocaleDateString('vi-VN');

          await tx.warehouseTransaction.create({
            data: {
              warehouseId: lot.warehouseId,
              productId: lot.productId,
              inventoryLotId: lot.id,
              type: 'adjustment',
              quantityKg: 0,
              note: `[CẬP NHẬT HẠN DÙNG] Thay đổi từ ${oldLabel} sang ${newLabel}. Lý do: ${dto.reason || ''}`,
              createdBy: currentUser.id,
            },
          });
        }
      }

      return updatedLot;
    });
  }

  // ===========================================================================
  // TRANSACTIONS (STAGE 3 & 4)
  // ===========================================================================

  async getTransactions(currentUser: InventoryUser, filters: any) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);
    const inventoryProfileId = await this.resolveInventoryProfileId(currentUser.id);
    const warehouseIds = await this.getWarehouseIds(adminId, inventoryProfileId, currentUser.role);

    const where: any = {
      warehouseId: { in: warehouseIds.length > 0 ? warehouseIds : ['NONE'] },
    };

    // --- Nhóm Lọc Cơ Bản (đã có từ trước nhưng chưa được áp dụng) ---
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.type) where.type = filters.type;
    if (filters.productId) where.productId = filters.productId;

    // --- Nhóm 2: Lọc Theo Thời Gian ---
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) {
        // Đặt thời gian cuối ngày để bao gồm cả ngày toDate
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    // --- Nhóm 3: Lọc Theo Nguồn Gốc & Đối Soát ---
    if (filters.inventoryLotId) where.inventoryLotId = filters.inventoryLotId;
    if (filters.createdBy) where.createdBy = filters.createdBy;

    // --- Nhóm 4: Lọc Theo Quy Mô & Ghi Chú ---
    if (filters.minQuantity || filters.maxQuantity) {
      where.quantityKg = {};
      if (filters.minQuantity) where.quantityKg.gte = Number(filters.minQuantity);
      if (filters.maxQuantity) where.quantityKg.lte = Number(filters.maxQuantity);
    }
    if (filters.noteSearch) {
      where.note = { contains: filters.noteSearch, mode: 'insensitive' };
    }

    const transactions = await this.prisma.warehouseTransaction.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true, unit: true } },
        inventoryLot: { select: { id: true, qualityGrade: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Lookup tên người tạo (createdBy là userId, không có relation)
    const creatorIds = [...new Set(transactions.map(t => t.createdBy).filter(Boolean))];
    const creators = creatorIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const creatorMap = new Map(creators.map(c => [c.id, c.fullName]));

    return transactions.map(t => ({
      ...t,
      actor: t.createdBy ? { fullName: creatorMap.get(t.createdBy) || 'Không rõ' } : null,
    }));
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

        // Kiểm tra độ lệch 5%
        const deviation = Math.abs(delta) / (currentLotBalance || 1);
        if (deviation > 0.05 && !dto.note) {
          throw new BadRequestException({
            code: 'ADJUSTMENT_DEVIATION_LARGE',
            message: `Khối lượng điều chỉnh lệch quá lớn (${(deviation * 100).toFixed(2)}% > 5%). Vui lòng nhập lý do giải trình.`,
            deviation: (deviation * 100).toFixed(2)
          });
        }

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
