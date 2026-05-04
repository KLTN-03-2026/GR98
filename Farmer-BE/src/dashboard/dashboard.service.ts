import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  AssignStatus,
  ContractStatus,
  FulfillStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
  ReviewStatus,
  ReportStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminOverviewQueryDto,
  AdminOverviewRangePreset,
} from './dto/admin-overview-query.dto';
import type { DashboardOverviewQueryDto } from './dto/dashboard-overview-query.dto';
import type {
  DashboardActivity,
  AdminDashboardActivity,
  AdminDashboardOverviewDto,
  AdminDashboardSection,
  AdminDashboardStatusSlice,
  AdminDashboardTimeseriesPoint,
  DashboardKpi,
  DashboardOverviewDto,
  DashboardScope,
  DashboardStatusSlice,
  DashboardTimePoint,
} from './dashboard.types';

type DashboardActor = {
  role: Role;
  adminId: string;
  supervisorProfileId: string | null;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function getRangeStartByPreset(
  preset: AdminOverviewRangePreset,
  now: Date,
): Date {
  if (preset === AdminOverviewRangePreset.LAST_7_DAYS) {
    return startOfDay(addDays(now, -6));
  }
  if (preset === AdminOverviewRangePreset.LAST_30_DAYS) {
    return startOfDay(addDays(now, -29));
  }
  if (preset === AdminOverviewRangePreset.MONTH_TO_DATE) {
    return startOfMonth(now);
  }
  return startOfDay(addDays(now, -13));
}

function safeDate(input: string | undefined): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}

function contractStatusLabel(s: ContractStatus): string {
  const map: Record<ContractStatus, string> = {
    DRAFT: 'Nháp',
    SIGNED: 'Đã ký',
    REJECTED: 'Từ chối',
    ACTIVE: 'Hiệu lực',
    EXPIRED: 'Hết hạn',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    SETTLED: 'Đã thanh toán',
    TERMINATED: 'Chấm dứt',
  };
  return map[s] ?? s;
}

function reportStatusLabel(s: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi',
    REVIEWED: 'Đã xem/Duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
  };
  return map[s] ?? s;
}

function paymentStatusLabel(s: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thất bại',
    REFUNDED: 'Hoàn tiền',
  };
  return map[s] ?? s;
}

function fulfillStatusLabel(s: FulfillStatus): string {
  const map: Record<FulfillStatus, string> = {
    PENDING: 'Chờ xử lý',
    PACKING: 'Đang đóng gói',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
  };
  return map[s] ?? s;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveActor(userId: string): Promise<DashboardActor> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Không xác định được người dùng hợp lệ');
    }

    if (user.role === Role.ADMIN) {
      const adminProfile = await this.prisma.adminProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!adminProfile) {
        throw new ForbiddenException('Không xác định được hồ sơ Admin');
      }
      return {
        role: user.role,
        adminId: adminProfile.id,
        supervisorProfileId: null,
      };
    }

    if (user.role === Role.SUPERVISOR) {
      const supervisorProfile = await this.prisma.supervisorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, adminId: true },
      });
      if (!supervisorProfile?.adminId) {
        throw new ForbiddenException('Không xác định được hồ sơ giám sát viên');
      }
      return {
        role: user.role,
        adminId: supervisorProfile.adminId,
        supervisorProfileId: supervisorProfile.id,
      };
    }

    throw new ForbiddenException('Bạn không có quyền xem dashboard');
  }

  async getOverview(
    userId: string,
    query: DashboardOverviewQueryDto = {},
  ): Promise<DashboardOverviewDto> {
    const actor = await this.resolveActor(userId);
    const now = new Date();
    const preset = query.rangePreset ?? AdminOverviewRangePreset.LAST_14_DAYS;
    const fromDate = safeDate(query.from);
    const toDate = safeDate(query.to);

    const rangeStart = fromDate
      ? startOfDay(fromDate)
      : getRangeStartByPreset(preset, now);
    const rangeEnd = toDate ? endOfDay(toDate) : endOfDay(now);

    if (rangeStart.getTime() > rangeEnd.getTime()) {
      throw new ForbiddenException('Khoảng thời gian không hợp lệ');
    }

    const rangeDays = Math.max(
      1,
      Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1,
    );
    const previousRangeEnd = endOfDay(addDays(rangeStart, -1));
    const previousRangeStart = startOfDay(addDays(rangeStart, -rangeDays));

    const isAdmin = actor.role === Role.ADMIN;
    const scope: DashboardScope = isAdmin ? 'global' : 'supervisor';
    const supId = actor.supervisorProfileId;

    const farmerWhere: Prisma.FarmerWhereInput = {
      adminId: actor.adminId,
      ...(supId ? { supervisorId: supId } : {}),
    };

    const plotWhere: Prisma.PlotWhereInput = {
      adminId: actor.adminId,
      ...(supId ? { farmer: { supervisorId: supId } } : {}),
    };

    const contractWhere: Prisma.ContractWhereInput = {
      adminId: actor.adminId,
      ...(supId ? { supervisorId: supId } : {}),
    };

    const dailyWhere: Prisma.DailyReportWhereInput = {
      adminId: actor.adminId,
      ...(supId ? { supervisorId: supId } : {}),
    };

    const orderWhere: Prisma.OrderWhereInput = { adminId: actor.adminId };

    const [
      farmersCurr,
      farmersPrev,
      plotsCurr,
      plotsPrev,
      contractsCurr,
      contractsPrev,
      ordersCurr,
      ordersPrev,
      reportsCurr,
      reportsPrev,
    ] = await Promise.all([
      this.prisma.farmer.count({
        where: {
          ...farmerWhere,
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      this.prisma.farmer.count({
        where: {
          ...farmerWhere,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.plot.count({
        where: {
          ...plotWhere,
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      this.prisma.plot.count({
        where: {
          ...plotWhere,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: {
          ...contractWhere,
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: {
          ...contractWhere,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      isAdmin
        ? this.prisma.order.count({
            where: {
              ...orderWhere,
              orderedAt: { gte: rangeStart, lte: rangeEnd },
            },
          })
        : Promise.resolve(0),
      isAdmin
        ? this.prisma.order.count({
            where: {
              ...orderWhere,
              orderedAt: { gte: previousRangeStart, lte: previousRangeEnd },
            },
          })
        : Promise.resolve(0),
      this.prisma.dailyReport.count({
        where: {
          ...dailyWhere,
          reportedAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      this.prisma.dailyReport.count({
        where: {
          ...dailyWhere,
          reportedAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
    ]);

    let scansCurr = 0;
    let scansPrev = 0;
    let assignmentsPending = 0;
    let missingDailyReportsToday: number | undefined;
    let dailyReportStatusDistribution: DashboardStatusSlice[] | undefined;

    if (supId) {
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const [
        scansC,
        scansP,
        pend,
        totalManagedPlots,
        coveredPlots,
        reportStatusGroups,
      ] = await Promise.all([
        this.prisma.plantScanRecord.count({
          where: {
            adminId: actor.adminId,
            supervisorId: supId,
            scannedAt: { gte: rangeStart, lte: rangeEnd },
          },
        }),
        this.prisma.plantScanRecord.count({
          where: {
            adminId: actor.adminId,
            supervisorId: supId,
            scannedAt: {
              gte: previousRangeStart,
              lte: previousRangeEnd,
            },
          },
        }),
        this.prisma.assignment.count({
          where: {
            adminId: actor.adminId,
            supervisorId: supId,
            status: AssignStatus.PENDING,
          },
        }),
        this.prisma.plot.count({ where: plotWhere }),
        this.prisma.dailyReport.findMany({
          where: {
            plot: plotWhere,
            reportedAt: { gte: todayStart, lte: todayEnd },
            status: { in: [ReportStatus.SUBMITTED, ReportStatus.REVIEWED] },
          },
          distinct: ['plotId'],
          select: { plotId: true },
        }),
        this.prisma.dailyReport.groupBy({
          by: ['status'],
          where: {
            ...dailyWhere,
            reportedAt: { gte: rangeStart, lte: rangeEnd },
          },
          _count: { _all: true },
        }),
      ]);
      scansCurr = scansC;
      scansPrev = scansP;
      assignmentsPending = pend;
      missingDailyReportsToday = Math.max(
        0,
        totalManagedPlots - coveredPlots.length,
      );
      dailyReportStatusDistribution = reportStatusGroups.map((g) => ({
        status: g.status,
        label: reportStatusLabel(g.status),
        count: g._count._all,
      }));
    }

    const kpis: DashboardKpi[] = [
      {
        id: 'farmers',
        label: 'Nông dân trong kỳ',
        value: farmersCurr,
        previousValue: farmersPrev,
        changePercent: pctChange(farmersCurr, farmersPrev),
      },
      {
        id: 'plots',
        label: 'Lô đất trong kỳ',
        value: plotsCurr,
        previousValue: plotsPrev,
        changePercent: pctChange(plotsCurr, plotsPrev),
      },
      {
        id: 'contracts',
        label: 'Hợp đồng trong kỳ',
        value: contractsCurr,
        previousValue: contractsPrev,
        changePercent: pctChange(contractsCurr, contractsPrev),
      },
      isAdmin
        ? {
            id: 'orders',
            label: 'Đơn hàng trong kỳ',
            value: ordersCurr,
            previousValue: ordersPrev,
            changePercent: pctChange(ordersCurr, ordersPrev),
          }
        : {
            id: 'daily_reports',
            label: 'Báo cáo trong kỳ',
            value: reportsCurr,
            previousValue: reportsPrev,
            changePercent: pctChange(reportsCurr, reportsPrev),
          },
    ];

    if (supId) {
      kpis.push(
        {
          id: 'plant_scans',
          label: 'Lượt quét AI trong kỳ',
          value: scansCurr,
          previousValue: scansPrev,
          changePercent: pctChange(scansCurr, scansPrev),
        },
        {
          id: 'assignments_pending',
          label: 'Phân công chờ xử lý',
          value: assignmentsPending,
          previousValue: assignmentsPending,
          changePercent: null,
        },
      );
    }

    const dayStarts: Date[] = [];
    for (let i = 0; i < rangeDays; i += 1) {
      dayStarts.push(startOfDay(addDays(rangeStart, i)));
    }

    const timeseriesPoints = await Promise.all(
      dayStarts.map(async (dayStart) => {
        const dayEnd = endOfDay(dayStart);
        const value = await this.prisma.contract.count({
          where: {
            ...contractWhere,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        });
        return {
          date: dayStart.toISOString().slice(0, 10),
          value,
        } satisfies DashboardTimePoint;
      }),
    );

    const statusGroups = await this.prisma.contract.groupBy({
      by: ['status'],
      where: {
        ...contractWhere,
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      _count: { _all: true },
    });

    const statusDistribution: DashboardStatusSlice[] = statusGroups.map(
      (g) => ({
        status: g.status,
        label: contractStatusLabel(g.status),
        count: g._count._all,
      }),
    );

    const [contractActs, reportActs, orderActs] = await Promise.all([
      this.prisma.contract.findMany({
        where: {
          ...contractWhere,
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          contractNo: true,
          status: true,
          createdAt: true,
          farmer: { select: { fullName: true } },
        },
      }),
      this.prisma.dailyReport.findMany({
        where: {
          ...dailyWhere,
          reportedAt: { gte: rangeStart, lte: rangeEnd },
        },
        orderBy: { reportedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          status: true,
          reportedAt: true,
          plot: { select: { plotCode: true } },
        },
      }),
      isAdmin
        ? this.prisma.order.findMany({
            where: {
              ...orderWhere,
              orderedAt: { gte: rangeStart, lte: rangeEnd },
            },
            orderBy: { orderedAt: 'desc' },
            take: 6,
            select: {
              id: true,
              orderNo: true,
              orderCode: true,
              fulfillStatus: true,
              orderedAt: true,
            },
          })
        : Promise.resolve<
            Array<{
              id: string;
              orderNo: string;
              orderCode: string | null;
              fulfillStatus: FulfillStatus;
              orderedAt: Date;
            }>
          >([]),
    ]);

    const baseContractPath = isAdmin
      ? '/dashboard/contracts'
      : '/supervisor/contracts';
    const baseOrderPath = '/dashboard/orders';

    const recentActivity: DashboardActivity[] = [
      ...contractActs.map((c) => ({
        id: c.id,
        type: 'contract' as const,
        title: c.contractNo,
        subtitle: c.farmer.fullName,
        at: c.createdAt.toISOString(),
        status: c.status,
        statusLabel: contractStatusLabel(c.status),
        href: `${baseContractPath}/${c.id}`,
      })),
      ...reportActs.map((r) => ({
        id: r.id,
        type: 'daily_report' as const,
        title: `Báo cáo — ${r.plot.plotCode}`,
        subtitle: null,
        at: r.reportedAt.toISOString(),
        status: r.status,
        statusLabel: reportStatusLabel(r.status),
        href: isAdmin
          ? '/dashboard/daily-reports'
          : '/supervisor/daily-reports',
      })),
      ...(isAdmin
        ? orderActs.map((o) => ({
            id: o.id,
            type: 'order' as const,
            title: o.orderCode || o.orderNo,
            subtitle: null,
            at: o.orderedAt.toISOString(),
            status: o.fulfillStatus,
            statusLabel: String(o.fulfillStatus),
            href: `${baseOrderPath}?highlight=${o.id}`,
          }))
        : []),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);

    return {
      scope,
      kpis,
      timeseries: timeseriesPoints,
      statusDistribution,
      recentActivity,
      ...(supId && missingDailyReportsToday !== undefined
        ? {
            missingDailyReportsToday,
            dailyReportStatusDistribution,
          }
        : {}),
    };
  }

  async getAdminOverview(
    userId: string,
    query: AdminOverviewQueryDto = {},
  ): Promise<AdminDashboardOverviewDto> {
    const actor = await this.resolveActor(userId);
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xem dashboard admin');
    }

    const adminId = actor.adminId;
    const now = new Date();
    const preset = query.rangePreset ?? AdminOverviewRangePreset.LAST_14_DAYS;
    const fromDate = safeDate(query.from);
    const toDate = safeDate(query.to);

    const rangeStart = fromDate
      ? startOfDay(fromDate)
      : getRangeStartByPreset(preset, now);
    const rangeEnd = toDate ? endOfDay(toDate) : endOfDay(now);

    if (rangeStart.getTime() > rangeEnd.getTime()) {
      throw new ForbiddenException('Khoảng thời gian không hợp lệ');
    }

    const rangeDays = Math.max(
      1,
      Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1,
    );
    const previousRangeEnd = endOfDay(addDays(rangeStart, -1));
    const previousRangeStart = startOfDay(addDays(rangeStart, -rangeDays));

    const [
      ordersCurr,
      ordersPrev,
      contractsCurr,
      contractsPrev,
      reportsCurr,
      reportsPrev,
      scansCurr,
      scansPrev,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { adminId, orderedAt: { gte: rangeStart, lte: rangeEnd } },
      }),
      this.prisma.order.count({
        where: {
          adminId,
          orderedAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.contract.count({
        where: { adminId, createdAt: { gte: rangeStart, lte: rangeEnd } },
      }),
      this.prisma.contract.count({
        where: {
          adminId,
          createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.dailyReport.count({
        where: { adminId, reportedAt: { gte: rangeStart, lte: rangeEnd } },
      }),
      this.prisma.dailyReport.count({
        where: {
          adminId,
          reportedAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
      this.prisma.plantScanRecord.count({
        where: { adminId, scannedAt: { gte: rangeStart, lte: rangeEnd } },
      }),
      this.prisma.plantScanRecord.count({
        where: {
          adminId,
          scannedAt: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      }),
    ]);

    const [revenueCurrAgg, revenuePrevAgg, buyersCurrRows, buyersPrevRows] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { adminId, orderedAt: { gte: rangeStart, lte: rangeEnd } },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: {
            adminId,
            orderedAt: { gte: previousRangeStart, lte: previousRangeEnd },
          },
          _sum: { total: true },
        }),
        this.prisma.order.findMany({
          where: { adminId, orderedAt: { gte: rangeStart, lte: rangeEnd } },
          select: { clientId: true },
          distinct: ['clientId'],
        }),
        this.prisma.order.findMany({
          where: {
            adminId,
            orderedAt: { gte: previousRangeStart, lte: previousRangeEnd },
          },
          select: { clientId: true },
          distinct: ['clientId'],
        }),
      ]);

    const [
      clientsTotal,
      clientsPrevTotal,
      productsPublished,
      productsPublishedPrev,
      warehousesActive,
      pendingReviews,
    ] = await Promise.all([
      this.prisma.clientProfile.count({
        where: { adminId, createdAt: { lte: rangeEnd } },
      }),
      this.prisma.clientProfile.count({
        where: { adminId, createdAt: { lte: previousRangeEnd } },
      }),
      this.prisma.product.count({
        where: {
          adminId,
          status: ProductStatus.PUBLISHED,
          createdAt: { lte: rangeEnd },
        },
      }),
      this.prisma.product.count({
        where: {
          adminId,
          status: ProductStatus.PUBLISHED,
          createdAt: { lte: previousRangeEnd },
        },
      }),
      this.prisma.warehouse.count({ where: { adminId, isActive: true } }),
      this.prisma.review.count({
        where: { product: { adminId }, status: ReviewStatus.PENDING },
      }),
    ]);

    const revenueCurr = revenueCurrAgg._sum.total ?? 0;
    const revenuePrev = revenuePrevAgg._sum.total ?? 0;
    const buyersCurr = buyersCurrRows.length;
    const buyersPrev = buyersPrevRows.length;

    const sections: AdminDashboardSection[] = [
      {
        id: 'commerce',
        title: 'Thương mại điện tử',
        cards: [
          {
            id: 'orders_mtd',
            label: 'Đơn hàng trong kỳ',
            value: ordersCurr,
            previousValue: ordersPrev,
            changePercent: pctChange(ordersCurr, ordersPrev),
          },
          {
            id: 'revenue_mtd',
            label: 'Doanh thu trong kỳ',
            value: revenueCurr,
            previousValue: revenuePrev,
            changePercent: pctChange(revenueCurr, revenuePrev),
            format: 'currency',
          },
          {
            id: 'buyers_mtd',
            label: 'Người đặt hàng trong kỳ',
            value: buyersCurr,
            previousValue: buyersPrev,
            changePercent: pctChange(buyersCurr, buyersPrev),
          },
          {
            id: 'clients_total',
            label: 'Tổng khách hàng',
            value: clientsTotal,
            previousValue: clientsPrevTotal,
            changePercent: pctChange(clientsTotal, clientsPrevTotal),
          },
        ],
      },
      {
        id: 'operations',
        title: 'Nông nghiệp & vận hành',
        cards: [
          {
            id: 'contracts_mtd',
            label: 'Hợp đồng trong kỳ',
            value: contractsCurr,
            previousValue: contractsPrev,
            changePercent: pctChange(contractsCurr, contractsPrev),
          },
          {
            id: 'reports_mtd',
            label: 'Báo cáo trong kỳ',
            value: reportsCurr,
            previousValue: reportsPrev,
            changePercent: pctChange(reportsCurr, reportsPrev),
          },
          {
            id: 'scans_mtd',
            label: 'Lượt quét AI trong kỳ',
            value: scansCurr,
            previousValue: scansPrev,
            changePercent: pctChange(scansCurr, scansPrev),
          },
          {
            id: 'published_products',
            label: 'Sản phẩm đang publish',
            value: productsPublished,
            previousValue: productsPublishedPrev,
            changePercent: pctChange(productsPublished, productsPublishedPrev),
          },
          {
            id: 'active_warehouses',
            label: 'Kho đang hoạt động',
            value: warehousesActive,
            previousValue: warehousesActive,
            changePercent: 0,
          },
          {
            id: 'pending_reviews',
            label: 'Đánh giá chờ duyệt',
            value: pendingReviews,
            previousValue: pendingReviews,
            changePercent: 0,
          },
        ],
      },
    ];

    const dayStarts: Date[] = [];
    for (let i = 0; i < rangeDays; i += 1) {
      dayStarts.push(startOfDay(addDays(rangeStart, i)));
    }

    const timeseries = await Promise.all(
      dayStarts.map(async (dayStart) => {
        const dayEnd = endOfDay(dayStart);
        const [orderCount, revenueAgg, contractCount] = await Promise.all([
          this.prisma.order.count({
            where: { adminId, orderedAt: { gte: dayStart, lte: dayEnd } },
          }),
          this.prisma.order.aggregate({
            where: { adminId, orderedAt: { gte: dayStart, lte: dayEnd } },
            _sum: { total: true },
          }),
          this.prisma.contract.count({
            where: { adminId, createdAt: { gte: dayStart, lte: dayEnd } },
          }),
        ]);

        return {
          date: dayStart.toISOString().slice(0, 10),
          orders: orderCount,
          revenue: revenueAgg._sum.total ?? 0,
          contracts: contractCount,
        } satisfies AdminDashboardTimeseriesPoint;
      }),
    );

    const [orderFulfillGroups, orderPaymentGroups, contractStatusGroups] =
      await Promise.all([
        this.prisma.order.groupBy({
          by: ['fulfillStatus'],
          where: { adminId, orderedAt: { gte: rangeStart, lte: rangeEnd } },
          _count: { _all: true },
        }),
        this.prisma.order.groupBy({
          by: ['paymentStatus'],
          where: { adminId, orderedAt: { gte: rangeStart, lte: rangeEnd } },
          _count: { _all: true },
        }),
        this.prisma.contract.groupBy({
          by: ['status'],
          where: { adminId, createdAt: { gte: rangeStart, lte: rangeEnd } },
          _count: { _all: true },
        }),
      ]);

    const orderFulfillDistribution: AdminDashboardStatusSlice[] =
      orderFulfillGroups.map((g) => ({
        key: g.fulfillStatus,
        label: fulfillStatusLabel(g.fulfillStatus),
        count: g._count._all,
      }));

    const orderPaymentDistribution: AdminDashboardStatusSlice[] =
      orderPaymentGroups.map((g) => ({
        key: g.paymentStatus,
        label: paymentStatusLabel(g.paymentStatus),
        count: g._count._all,
      }));

    const contractStatusDistribution: AdminDashboardStatusSlice[] =
      contractStatusGroups.map((g) => ({
        key: g.status,
        label: contractStatusLabel(g.status),
        count: g._count._all,
      }));

    const [recentOrders, recentContracts, recentReports] = await Promise.all([
      this.prisma.order.findMany({
        where: { adminId, orderedAt: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { orderedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          orderCode: true,
          orderNo: true,
          orderedAt: true,
          fulfillStatus: true,
        },
      }),
      this.prisma.contract.findMany({
        where: { adminId, createdAt: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          contractNo: true,
          status: true,
          createdAt: true,
          farmer: { select: { fullName: true } },
        },
      }),
      this.prisma.dailyReport.findMany({
        where: { adminId, reportedAt: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { reportedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          status: true,
          reportedAt: true,
          plot: { select: { plotCode: true } },
          supervisor: { select: { user: { select: { fullName: true } } } },
        },
      }),
    ]);

    const recentActivity: AdminDashboardActivity[] = [
      ...recentOrders.map((o) => ({
        id: o.id,
        type: 'order' as const,
        title: o.orderCode || o.orderNo,
        subtitle: null,
        at: o.orderedAt.toISOString(),
        status: o.fulfillStatus,
        statusLabel: fulfillStatusLabel(o.fulfillStatus),
        href: '/dashboard/orders',
      })),
      ...recentContracts.map((c) => ({
        id: c.id,
        type: 'contract' as const,
        title: c.contractNo,
        subtitle: c.farmer.fullName,
        at: c.createdAt.toISOString(),
        status: c.status,
        statusLabel: contractStatusLabel(c.status),
        href: `/dashboard/contracts/${c.id}`,
      })),
      ...recentReports.map((r) => ({
        id: r.id,
        type: 'daily_report' as const,
        title: `Báo cáo ${r.plot.plotCode}`,
        subtitle: r.supervisor.user.fullName,
        at: r.reportedAt.toISOString(),
        status: r.status,
        statusLabel: reportStatusLabel(r.status),
        href: '/dashboard/daily-reports',
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 15);

    return {
      scope: 'global',
      sections,
      timeseries,
      orderFulfillDistribution,
      orderPaymentDistribution,
      contractStatusDistribution,
      recentActivity,
    };
  }
}
