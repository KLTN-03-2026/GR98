import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, QualityGrade, ReportStatus, ReportType, ContractStatus, TransactionType, TransactionAction, FulfillStatus, PaymentStatus, InventoryLotStatus } from '@prisma/client';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateInventoryLotDto } from './dto/create-inventory-lot.dto';
import { UpdateLotGradeDto } from './dto/update-lot-grade.dto';
import { ReceiveHarvestDto } from './dto/receive-harvest.dto';
import { UpdateInventoryLotDto } from './dto/update-inventory-lot.dto';
import { computeDefaultExpiry } from '../common/utils/expiry.util';

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

    if (role === Role.SUPERVISOR) {
      const supervisor = await this.prisma.supervisorProfile.findUnique({
        where: { userId: currentUserId },
        select: { adminId: true },
      });
      if (!supervisor) {
        throw new ForbiddenException('Không xác định được hồ sơ giám sát viên');
      }
      return supervisor.adminId;
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
    capacityKg: number | null;
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
      capacityKg: w.capacityKg,
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

    const [totalStockResult, pendingOrdersCount, expiringLotsCount, stagnantLotsResult, warehousesList, recentTransactions, pendingOrdersList] = await Promise.all([
      warehouseIds.length > 0
        ? this.prisma.inventoryLot.aggregate({
          where: {
            warehouseId: { in: warehouseIds },
            status: InventoryLotStatus.RECEIVED
          },
          _sum: { quantityKg: true },
        })
        : { _sum: { quantityKg: null } },
      this.prisma.order.count({
        where: { adminId, fulfillStatus: FulfillStatus.PENDING, paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.PAID] } },
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
            NOT: { transactions: { some: { type: TransactionType.OUTBOUND, createdAt: { gte: thirtyDaysAgo } } } },
          }
          : { warehouseId: 'IMPOSSIBLE' },
      }),
      warehouseIds.length > 0
        ? this.prisma.warehouse.findMany({
          where: { id: { in: warehouseIds }, isActive: true },
          select: {
            id: true,
            name: true,
            locationAddress: true,
            capacityKg: true,
            _count: { select: { inventoryLots: true } }
          },
          take: 5
        })
        : [],
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
        where: { adminId, fulfillStatus: FulfillStatus.PENDING, paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.PAID] } },
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
      activeWarehouses: warehouseIds.length,
      warehousesList: await Promise.all(warehousesList.map(async w => {
        const stockResult = await this.prisma.inventoryLot.aggregate({
          where: { warehouseId: w.id, status: { in: ['ARRIVED', 'RECEIVED'] } },
          _sum: { quantityKg: true }
        });
        return {
          id: w.id,
          name: w.name,
          locationAddress: w.locationAddress,
          lotCount: w._count.inventoryLots,
          capacityKg: w.capacityKg,
          currentStock: stockResult._sum.quantityKg || 0
        };
      })),
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
          where: { warehouseId: { in: warehouseIds }, type: TransactionType.INBOUND, createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { quantityKg: true },
        }),
        this.prisma.warehouseTransaction.aggregate({
          where: { warehouseId: { in: warehouseIds }, type: TransactionType.OUTBOUND, createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { quantityKg: true },
        }),
        this.prisma.warehouseTransaction.aggregate({
          where: { warehouseId: { in: warehouseIds }, type: TransactionType.ADJUSTMENT, createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { quantityKg: true },
        }),
      ]);
      inbound.push(inRes._sum?.quantityKg ?? 0);
      outbound.push(outRes._sum?.quantityKg ?? 0);
      adjustment.push(adjRes._sum?.quantityKg ?? 0);
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

    const currentStocks = await Promise.all(
      warehouses.map(w => 
        this.prisma.inventoryLot.aggregate({
          where: {
            warehouseId: w.id,
            status: { in: ['ARRIVED', 'RECEIVED'] }
          },
          _sum: { quantityKg: true }
        })
      )
    );

    return warehouses.map((w, index) => ({
      ...this.mapWarehouseListItem(w),
      currentStock: currentStocks[index]._sum.quantityKg || 0
    }));
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
    
    const currentStockResult = await this.prisma.inventoryLot.aggregate({
      where: {
        warehouseId: id,
        status: { in: ['ARRIVED', 'RECEIVED'] }
      },
      _sum: { quantityKg: true }
    });

    return {
      ...warehouse,
      currentStock: currentStockResult._sum.quantityKg || 0
    };
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
        capacityKg: dto.capacityKg,
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
        capacityKg: dto.capacityKg,
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
                cropType: true,
                zone: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Cấu trúc lại kết quả trả về với hiệu năng cao (O(1) time)
    const enrichedLots = lots.map((lot) => {
      const isUpcoming = lot.status === InventoryLotStatus.SCHEDULED || (lot.harvestDate && lot.harvestDate > now);

      // Tính trạng thái hết hạn
      const isExpired = lot.expiryDate && new Date(lot.expiryDate) < now;
      const isExpiringSoon = lot.expiryDate && !isExpired
        && new Date(lot.expiryDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        ...lot,
        isUpcoming,
        isExpired,
        isExpiringSoon,
        statusLabel: isUpcoming ? 'Dự kiến' : lot.quantityKg <= 0 ? 'Đã hết' : 'Trong kho',
      };
    });

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

      const lotStatus = harvestDate && harvestDate > now ? InventoryLotStatus.SCHEDULED : InventoryLotStatus.ARRIVED;

      // Nếu DTO không truyền expiryDate, tự tính theo cropType + harvestDate.
      // Logic FEFO khi bán hàng (order.service) dựa vào field này nên cần đảm
      // bảo mỗi lot mới đều có expiry hợp lý. Nhân viên kho vẫn có thể truyền
      // tay để override (vd. cà phê rang xay có hạn ngắn hơn cà phê nhân).
      let expiryDate: Date | null = dto.expiryDate ? new Date(dto.expiryDate) : null;
      if (!expiryDate) {
        const product = await tx.product.findUnique({
          where: { id: dto.productId },
          select: { cropType: true },
        });
        expiryDate = computeDefaultExpiry(product?.cropType, harvestDate ?? now);
      }

      const lot = await tx.inventoryLot.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          contractId: dto.contractId || null,
          quantityKg: dto.quantityKg,
          qualityGrade: dto.qualityGrade,
          harvestDate: harvestDate,
          expiryDate,
          status: lotStatus,
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

  async getRemainingBalance(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        plotId: true,
        signedAt: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    if (!contract || !contract.plotId) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }

    // Thời điểm "bắt đầu" của contract — dùng để giới hạn báo cáo HARVEST
    // được tính vào tổng thu hoạch của hợp đồng này.
    //
    // Lý do: 1 plot có thể tái sử dụng qua nhiều mùa vụ → nhiều contract
    // trên cùng plotId. Nếu cộng tất cả HARVEST report của plot vào contract
    // hiện tại sẽ bị trùng số liệu của mùa vụ trước.
    //
    // Ưu tiên: signedAt > approvedAt > createdAt. Fallback xa nhất nếu thiếu.
    const contractStart =
      contract.signedAt ?? contract.approvedAt ?? contract.createdAt;

    // Tổng sản lượng từ các báo cáo HARVEST cho plot này, chỉ tính những
    // báo cáo phát sinh kể từ khi contract bắt đầu (không gộp mùa vụ cũ).
    const totalYieldResult = await this.prisma.dailyReport.aggregate({
      where: {
        plotId: contract.plotId,
        type: 'HARVEST',
        status: { notIn: ['DRAFT', 'REJECTED'] },
        reportedAt: { gte: contractStart },
      },
      _sum: { yieldEstimateKg: true },
    });

    const totalYield = totalYieldResult._sum?.yieldEstimateKg || 0;

    // Tổng đã xuất: cộng quantityKg dương của các InventoryLot thuộc contract
    // này (loại REJECTED và SCHEDULED). Filter `gt: 0` để loại data rác từ
    // bug -2050kg cũ — các record âm là di tích từ trước khi fix FEFO, không
    // phản ánh sản lượng thực sự đã xuất.
    const totalIssued = await this.prisma.inventoryLot.aggregate({
      where: {
        contractId,
        status: { notIn: [InventoryLotStatus.REJECTED, InventoryLotStatus.SCHEDULED] },
        quantityKg: { gt: 0 },
      },
      _sum: { quantityKg: true },
    });

    const alreadyIssued = totalIssued._sum.quantityKg || 0;
    const remaining = Math.max(0, totalYield - alreadyIssued);

    return {
      totalYield,
      alreadyIssued,
      remaining,
    };
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
        select: {
          id: true,
          adminId: true,
          status: true,
          cropType: true,
          grade: true,
          farmerId: true,
          plotId: true,
          plotDraftProvince: true,
          plotDraftDistrict: true,
          product: { select: { id: true } },
        },
      })
    ]);

    if (!report || report.adminId !== adminId) {
      throw new NotFoundException('Báo cáo thực địa không tồn tại');
    }

    if (!contract || contract.adminId !== adminId) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }

    // Nếu hợp đồng không có product riêng (đã được gộp vào product của hợp đồng khác
    // cùng cropType + grade + vùng địa lý), tra cứu product dùng chung thay thế.
    // Dùng 2 bước tường minh thay vì OR lồng relation để tránh lỗi Prisma.
    let resolvedProductId: string | undefined = contract.product?.id;
    if (!resolvedProductId) {
      let sharedProductId: string | undefined;

      // ── Nhánh A: so qua zone của plot ──
      if (contract.plotId) {
        const plotInfo = await this.prisma.plot.findUnique({
          where: { id: contract.plotId },
          include: { zone: { select: { province: true, district: true } } },
        });

        if (plotInfo?.zone?.province) {
          const samePlotIds = await this.prisma.plot.findMany({
            where: {
              zone: {
                province: plotInfo.zone.province,
                ...(plotInfo.zone.district ? { district: plotInfo.zone.district } : {}),
              },
            },
            select: { id: true },
          });

          if (samePlotIds.length > 0) {
            const found = await this.prisma.product.findFirst({
              where: {
                adminId,
                cropType: contract.cropType,
                grade: contract.grade,
                status: { notIn: ['ARCHIVED'] },
                plotId: { in: samePlotIds.map((p) => p.id) },
              },
              select: { id: true },
              orderBy: { createdAt: 'asc' },
            });
            sharedProductId = found?.id;
          }
        }
      }

      // ── Nhánh B: so qua contract.plotDraftProvince/District ──
      // (dùng khi plot không có zone trong DB hoặc plot chưa được gán)
      if (!sharedProductId && contract.plotDraftProvince) {
        const sameAreaContracts = await this.prisma.contract.findMany({
          where: {
            adminId,
            plotDraftProvince: contract.plotDraftProvince,
            ...(contract.plotDraftDistrict
              ? { plotDraftDistrict: contract.plotDraftDistrict }
              : {}),
          },
          select: { id: true },
        });

        if (sameAreaContracts.length > 0) {
          const found = await this.prisma.product.findFirst({
            where: {
              adminId,
              cropType: contract.cropType,
              grade: contract.grade,
              status: { notIn: ['ARCHIVED'] },
              contractId: { in: sameAreaContracts.map((c) => c.id) },
            },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          sharedProductId = found?.id;
        }
      }

      resolvedProductId = sharedProductId;
    }

    if (!resolvedProductId) {
      throw new BadRequestException('Hợp đồng này chưa được liên kết với sản phẩm thương mại');
    }

    // 3. Yield Balance Logic (Cumulative across all harvest reports for this contract)
    // Tổng sản lượng từ TẤT CẢ báo cáo thu hoạch đã duyệt cho contract này
    const totalYieldResult = await this.prisma.dailyReport.aggregate({
      where: {
        plotId: contract.plotId ?? report.plotId,
        type: 'HARVEST',
        status: { notIn: ['DRAFT', 'REJECTED'] },
      },
      _sum: { yieldEstimateKg: true },
    });

    const totalYield = totalYieldResult._sum.yieldEstimateKg || 0;

    const totalIssued = await this.prisma.inventoryLot.aggregate({
      where: {
        contractId,
        status: { notIn: [InventoryLotStatus.REJECTED, InventoryLotStatus.SCHEDULED] },
      },
      _sum: { quantityKg: true },
    });

    const alreadyIssued = totalIssued._sum.quantityKg || 0;
    const remaining = totalYield - alreadyIssued;

    if (actualWeight > remaining + totalYield * 0.01) { // 1% buffer for rounding
      throw new BadRequestException(
        `Số lượng xuất (${actualWeight}kg) vượt quá sản lượng còn lại khả dụng (${remaining.toFixed(2)}kg).`,
      );
    }

    // 4. Pre-check: Sức chứa kho (ngoài transaction để BadRequestException trả về đúng)
    const existingScheduledLot = await this.prisma.inventoryLot.findFirst({
      where: {
        contractId,
        status: InventoryLotStatus.SCHEDULED,
      },
      orderBy: { createdAt: 'asc' },
    });

    const targetWarehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { capacityKg: true, name: true }
    });

    if (targetWarehouse && targetWarehouse.capacityKg !== null) {
      const currentLots = await this.prisma.inventoryLot.aggregate({
        where: {
          warehouseId,
          status: { in: [InventoryLotStatus.ARRIVED, InventoryLotStatus.RECEIVED, InventoryLotStatus.SCHEDULED] },
          ...(existingScheduledLot ? { id: { not: existingScheduledLot.id } } : {})
        },
        _sum: { quantityKg: true }
      });
      
      const currentStock = currentLots._sum.quantityKg || 0;
      const remainingCapacity = targetWarehouse.capacityKg - currentStock;

      if (actualWeight > remainingCapacity) {
        throw new BadRequestException(
          `Kho "${targetWarehouse.name}" không đủ chỗ chứa. Sức chứa còn lại: ${remainingCapacity.toFixed(2)}kg, khối lượng nhập: ${actualWeight}kg.`
        );
      }
    }

    // 5. Atomic Transaction
    return this.prisma.$transaction(async (tx) => {
      let lot;
      if (existingScheduledLot) {
        // Cập nhật lô SCHEDULED thành ARRIVED với kho thực tế và số cân thực tế
        lot = await tx.inventoryLot.update({
          where: { id: existingScheduledLot.id },
          data: {
            warehouseId,
            quantityKg: actualWeight,
            qualityGrade,
            harvestDate: new Date(),
            status: InventoryLotStatus.ARRIVED,
          },
        });
      } else {
        // Fallback: Tạo mới lô hàng ARRIVED (nếu chưa có SCHEDULED).
        // Auto-tính expiryDate theo cropType (giống createLot) — FEFO sort khi
        // bán hàng cần field này.
        const product = await tx.product.findUnique({
          where: { id: resolvedProductId! },
          select: { cropType: true },
        });
        const harvestNow = new Date();
        lot = await tx.inventoryLot.create({
          data: {
            warehouseId,
            productId: resolvedProductId!,
            contractId,
            quantityKg: actualWeight,
            qualityGrade,
            harvestDate: harvestNow,
            expiryDate: computeDefaultExpiry(product?.cropType, harvestNow),
            status: InventoryLotStatus.ARRIVED,
          },
        });
      }

      // B. Update Daily Report Status if almost exhausted (optional, let's keep it consistent)
      // Note: We only update to REVIEWED if the user is finishing up or if we want to track progress.
      // For simplicity, we'll keep it as is, or you might want to only set it to REVIEWED when 100% done.
      if (actualWeight >= remaining - 1) { // Within 1kg of finishing
        await tx.dailyReport.update({
          where: { id: dailyReportId },
          data: { status: 'REVIEWED' },
        });
      }

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
      if (lot.status === InventoryLotStatus.RECEIVED) throw new BadRequestException('Lô hàng này đã được nhập kho trước đó');

      // 1. Cập nhật lô hàng sang RECEIVED
      const updatedLot = await tx.inventoryLot.update({
        where: { id: lotId },
        data: {
          status: InventoryLotStatus.RECEIVED,
          quantityKg: actualWeight, // Cập nhật khối lượng thực nhập
        }
      });

      // 2. Tạo bản ghi giao dịch kho (Transaction)
      await tx.warehouseTransaction.create({
        data: {
          warehouseId: lot.warehouseId,
          productId: lot.productId,
          inventoryLotId: lot.id,
          type: TransactionType.INBOUND,
          action: TransactionAction.RECEIPT,
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

      console.log(`[STOCK_UPDATE] Product ID: ${lot.productId}, Added: ${actualWeight}kg`);

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

      if (lot.status !== InventoryLotStatus.ARRIVED && lot.status !== InventoryLotStatus.SCHEDULED) {
        throw new BadRequestException('Chỉ có thể từ chối lô hàng đang chờ nhập kho hoặc sắp về');
      }

      const updatedLot = await tx.inventoryLot.update({
        where: { id: lotId },
        data: {
          status: InventoryLotStatus.REJECTED,
        }
      });

      // Ghi log vào giao dịch kho (loại adjustment với số lượng 0 để làm timeline)
      await tx.warehouseTransaction.create({
        data: {
          warehouseId: lot.warehouseId,
          productId: lot.productId,
          inventoryLotId: lot.id,
          type: TransactionType.ADJUSTMENT,
          action: TransactionAction.REJECTION,
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

    // Lấy khối lượng ban đầu từ giao dịch INBOUND đầu tiên
    let initialWeight = lot.quantityKg; // fallback
    if (lot.transactions && lot.transactions.length > 0) {
      // Lọc các giao dịch INBOUND và sắp xếp theo thời gian cũ nhất
      const inboundTransactions = lot.transactions
        .filter(t => t.type === TransactionType.INBOUND)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const firstInbound = inboundTransactions[0];
      if (firstInbound && firstInbound.quantityKg > 0) {
        initialWeight = firstInbound.quantityKg;
      }
    }

    return {
      ...lot,
      initialWeight,
      isUpcoming,
      statusLabel: isUpcoming ? 'Dự kiến' : 'Trong kho',
    };
  }

  async updateLotGrade(id: string, currentUser: InventoryUser, dto: UpdateLotGradeDto) {
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id },
      select: { status: true }
    });

    if ((lot?.status === InventoryLotStatus.RECEIVED || lot?.status === InventoryLotStatus.ARRIVED) && dto.qualityGrade === 'REJECT') {
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

    if ((lot.status === InventoryLotStatus.RECEIVED || lot.status === InventoryLotStatus.ARRIVED) && dto.qualityGrade === 'REJECT') {
      throw new BadRequestException('Không thể sử dụng phẩm cấp REJECT. Vui lòng sử dụng chức năng "Từ chối lô hàng" để xử lý các lô hàng không đạt yêu cầu.');
    }

    const now = new Date();
    // Chỉ chặn cập nhật nếu lô hàng là dự kiến (SCHEDULED) VÀ đang cố gắng thay đổi các thông tin không phải phẩm cấp/hạn dùng
    // Nếu là cập nhật phẩm cấp hoặc hạn dùng, chúng ta coi đó là hiệu chỉnh thông tin (Correction) nên cho phép.
    if (lot.status === InventoryLotStatus.SCHEDULED && (dto.harvestDate)) {
      throw new BadRequestException('Không thể cập nhật ngày thu hoạch cho lô hàng dự kiến. Vui lòng thực hiện tại mục quản lý hợp đồng/thu hoạch.');
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
            type: TransactionType.ADJUSTMENT,
            action: TransactionAction.GRADE_UPDATE,
            quantityKg: 0,
            note: `[CẬP NHẬT PHẨM CẤP] Thay đổi từ Loại ${lot.qualityGrade} sang Loại ${dto.qualityGrade}. Lý do: ${dto.reason || 'Không có lý do chi tiết'}`,
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
              type: TransactionType.ADJUSTMENT,
              action: TransactionAction.EXPIRY_UPDATE,
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

      // 2. Xác định action nếu chưa có
      let action = dto.action;
      if (!action) {
        if (dto.isTransfer) action = TransactionAction.INTERNAL_TRANSFER;
        else if (dto.type === TransactionType.INBOUND) action = TransactionAction.RECEIPT;
        else if (dto.type === TransactionType.OUTBOUND) action = TransactionAction.SALE;
        else if (dto.type === TransactionType.ADJUSTMENT) action = TransactionAction.WEIGHT_ADJUST;
        else action = TransactionAction.OTHER;
      }

      // 3. Tạo bản ghi giao dịch cho kho xuất
      const transaction = await tx.warehouseTransaction.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          inventoryLotId: dto.inventoryLotId,
          type: dto.type,
          action: action,
          quantityKg: delta,
          note: dto.note || '',
          createdBy: currentUser.id,
        },
      });

      // 4. Nếu là điều chuyển, tạo bản ghi nhập cho kho nhận
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
            action: TransactionAction.INTERNAL_TRANSFER,
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

      // 5. Cập nhật khối lượng hiện tại của lô hàng (InventoryLot)
      if (delta !== 0) {
        await tx.inventoryLot.update({
          where: { id: dto.inventoryLotId },
          data: { quantityKg: { increment: delta } },
        });
      }

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

  async getClients(currentUser: InventoryUser) {
    const adminId = await this.resolveAdminId(currentUser.id, currentUser.role);

    return this.prisma.clientProfile.findMany({
      where: {
        OR: [
          { adminId },
          { adminId: null } // Bao gồm cả khách hàng vãng lai chưa gán admin cụ thể
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            orders: true
          }
        },
        shippingAddresses: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
