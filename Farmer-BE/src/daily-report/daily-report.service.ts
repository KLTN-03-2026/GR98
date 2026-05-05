import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignStatus,
  ContractStatus,
  Prisma,
  ReportStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { QueryDailyReportDto } from './dto/query-daily-report.dto';

const MAX_IMAGES = 10;
const MAX_IMAGE_ENTRY_CHARS = 7_000_000;

type ActorContext = {
  role: Role;
  adminId: string | null;
  supervisorProfileId: string | null;
};

const reportListInclude = {
  plot: {
    select: {
      id: true,
      plotCode: true,
      cropType: true,
      areaHa: true,
      contracts: {
        where: { status: ContractStatus.ACTIVE },
        take: 1,
        select: {
          id: true,
          contractNo: true,
          grade: true,
          product: { select: { id: true, name: true } },
        },
      },
      farmer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
  },
  supervisor: {
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
          phone: true,
        },
      },
    },
  },
} satisfies Prisma.DailyReportInclude;

@Injectable()
export class DailyReportService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveActorContext(userId: string): Promise<ActorContext | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return {
        role: user.role,
        adminId: profile?.id ?? null,
        supervisorProfileId: null,
      };
    }

    if (user.role === Role.SUPERVISOR) {
      const profile = await this.prisma.supervisorProfile.findUnique({
        where: { userId },
        select: { id: true, adminId: true },
      });
      return {
        role: user.role,
        adminId: profile?.adminId ?? null,
        supervisorProfileId: profile?.id ?? null,
      };
    }

    return {
      role: user.role,
      adminId: null,
      supervisorProfileId: null,
    };
  }

  private normalizeImageUrls(urls?: string[]): string[] {
    if (!urls?.length) return [];
    const trimmed = urls.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean);
    if (trimmed.length > MAX_IMAGES) {
      throw new BadRequestException(`Tối đa ${MAX_IMAGES} ảnh đính kèm`);
    }
    for (const entry of trimmed) {
      if (entry.length > MAX_IMAGE_ENTRY_CHARS) {
        throw new BadRequestException('Một ảnh đính kèm vượt quá dung lượng cho phép');
      }
    }
    return trimmed;
  }

  private assertSubmitPayload(content: string, imageUrls: string[], yieldEstimateKg?: number | null) {
    if (!content.trim()) {
      throw new BadRequestException('Nội dung báo cáo không được để trống khi gửi');
    }
    if (imageUrls.length < 1) {
      const msg = yieldEstimateKg && yieldEstimateKg > 0 
        ? 'Báo cáo ghi nhận sản lượng thu hoạch bắt buộc phải có ít nhất một ảnh minh chứng'
        : 'Cần ít nhất một ảnh đính kèm khi gửi báo cáo';
      throw new BadRequestException(msg);
    }
  }

  private async assertSupervisorPlotAccess(
    plotId: string,
    supervisorProfileId: string,
    adminId: string,
  ) {
    const plot = await this.prisma.plot.findFirst({
      where: { id: plotId, adminId },
      select: { id: true },
    });
    if (!plot) {
      throw new NotFoundException('Không tìm thấy lô đất');
    }
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        plotId,
        adminId,
        supervisorId: supervisorProfileId,
        status: { in: [AssignStatus.PENDING, AssignStatus.ACTIVE] },
      },
      select: { id: true },
    });
    if (!assignment) {
      throw new ForbiddenException('Bạn không được phép báo cáo trên lô đất này');
    }
  }

  private async assertHarvestUniqueness(
    plotId: string,
    adminId: string,
    supervisorId: string,
    skipReportId?: string,
  ) {
    // 1. Find the active assignment for this supervisor and plot
    const activeAssignment = await this.prisma.assignment.findFirst({
      where: {
        plotId,
        supervisorId,
        adminId,
        status: AssignStatus.ACTIVE,
      },
      orderBy: { dueDate: 'asc' }, // Get the one with closest dueDate
      select: { assignedAt: true, id: true },
    });

    if (!activeAssignment) {
      throw new BadRequestException(
        'Bạn không có phân công hoạt động nào trên lô đất này để báo cáo thu hoạch.',
      );
    }

    // 2. Check if any non-rejected HARVEST report exists since the assignment started
    const existingActiveHarvest = await this.prisma.dailyReport.findFirst({
      where: {
        plotId,
        adminId,
        type: 'HARVEST',
        status: { not: ReportStatus.REJECTED },
        reportedAt: { gte: activeAssignment.assignedAt },
        ...(skipReportId ? { id: { not: skipReportId } } : {}),
      },
    });

    if (existingActiveHarvest) {
      const status = existingActiveHarvest.status;
      const msg = status === ReportStatus.APPROVED 
        ? 'Sản lượng thu hoạch cho đợt phân công này đã được phê duyệt.'
        : 'Đã tồn tại một báo cáo thu hoạch đang chờ duyệt hoặc ở trạng thái nháp.';
      throw new BadRequestException(`${msg} Không thể tạo thêm báo cáo mới.`);
    }
  }

  async create(dto: CreateDailyReportDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (actor?.role !== Role.SUPERVISOR || !actor.supervisorProfileId || !actor.adminId) {
      throw new ForbiddenException('Chỉ giám sát viên mới được tạo báo cáo');
    }

    await this.assertSupervisorPlotAccess(
      dto.plotId,
      actor.supervisorProfileId,
      actor.adminId,
    );

    if (dto.type === 'HARVEST') {
      await this.assertHarvestUniqueness(dto.plotId, actor.adminId, actor.supervisorProfileId);
    }

    const imageUrls = this.normalizeImageUrls(dto.imageUrls);
    const content = dto.content?.trim() ?? '';

    return this.prisma.dailyReport.create({
      data: {
        plotId: dto.plotId,
        supervisorId: actor.supervisorProfileId,
        adminId: actor.adminId,
        type: dto.type ?? undefined,
        content,
        imageUrls,
        status: ReportStatus.DRAFT,
        yieldEstimateKg: dto.yieldEstimateKg ?? undefined,
      },
      include: reportListInclude,
    });
  }

  async update(id: string, dto: UpdateDailyReportDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (actor?.role !== Role.SUPERVISOR || !actor.supervisorProfileId || !actor.adminId) {
      throw new ForbiddenException('Chỉ giám sát viên mới được cập nhật báo cáo');
    }

    const existing = await this.prisma.dailyReport.findFirst({
      where: {
        id,
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    if (existing.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Chỉ có thể sửa báo cáo ở trạng thái nháp');
    }

    const imageUrls =
      dto.imageUrls !== undefined
        ? this.normalizeImageUrls(dto.imageUrls)
        : undefined;

    return this.prisma.dailyReport.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(imageUrls !== undefined ? { imageUrls } : {}),
        ...(dto.yieldEstimateKg !== undefined ? { yieldEstimateKg: dto.yieldEstimateKg } : {}),
      },
      include: reportListInclude,
    });
  }

  async submit(id: string, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (actor?.role !== Role.SUPERVISOR || !actor.supervisorProfileId || !actor.adminId) {
      throw new ForbiddenException('Chỉ giám sát viên mới được gửi báo cáo');
    }

    const existing = await this.prisma.dailyReport.findFirst({
      where: {
        id,
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    if (existing.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Báo cáo đã được gửi hoặc không còn ở trạng thái nháp');
    }

    this.assertSubmitPayload(existing.content, existing.imageUrls, existing.yieldEstimateKg);

    if (existing.type === 'HARVEST') {
      await this.assertHarvestUniqueness(existing.plotId, actor.adminId, actor.supervisorProfileId, existing.id);
    }

    return this.prisma.dailyReport.update({
      where: { id },
      data: { status: ReportStatus.SUBMITTED },
      include: reportListInclude,
    });
  }

  async findAll(query: QueryDailyReportDto, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId) {
      throw new ForbiddenException('Không xác định được tenant');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DailyReportWhereInput = {
      adminId: actor.adminId,
    };

    if (actor.role === Role.SUPERVISOR) {
      if (!actor.supervisorProfileId) {
        throw new ForbiddenException('Không xác định được hồ sơ giám sát viên');
      }
      where.supervisorId = actor.supervisorProfileId;
    } else if (actor.role === Role.ADMIN) {
      if (query.supervisorId?.trim()) {
        where.supervisorId = query.supervisorId.trim();
      }
      if (query.status) {
        where.status = query.status;
      } else {
        where.status = {
          in: [
            ReportStatus.SUBMITTED,
            ReportStatus.REVIEWED,
            ReportStatus.APPROVED,
            ReportStatus.REJECTED,
          ],
        };
      }
    } else {
      throw new ForbiddenException('Không có quyền xem danh sách báo cáo');
    }

    if (query.plotId?.trim()) {
      where.plotId = query.plotId.trim();
    }

    if (actor.role === Role.SUPERVISOR && query.status) {
      where.status = query.status;
    }

    if (query.from || query.to) {
      where.reportedAt = {};
      if (query.from) {
        where.reportedAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.reportedAt.lte = new Date(query.to);
      }
    }

    if (query.type?.trim()) {
      where.type = query.type.trim() as any;
    }

    if (query.search?.trim()) {
      where.content = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    if (query.isHarvest !== undefined) {
      if (query.isHarvest === 'true') {
        where.yieldEstimateKg = { gt: 0 };
      } else if (query.isHarvest === 'false') {
        where.yieldEstimateKg = { equals: null };
      }
    }

    const [rows, total, summary] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportedAt: 'desc' },
        include: reportListInclude,
      }),
      this.prisma.dailyReport.count({ where }),
      this.prisma.dailyReport.aggregate({
        _sum: { yieldEstimateKg: true },
        where,
      }),
    ]);

    return new PaginatedResponse(rows, total, page, limit, {
      totalYield: summary._sum.yieldEstimateKg || 0,
    });
  }

  async findOne(id: string, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (!actor?.adminId) {
      throw new ForbiddenException('Không xác định được tenant');
    }

    const where: Prisma.DailyReportWhereInput = {
      id,
      adminId: actor.adminId,
    };

    if (actor.role === Role.SUPERVISOR) {
      if (!actor.supervisorProfileId) {
        throw new ForbiddenException('Không xác định được hồ sơ giám sát viên');
      }
      where.supervisorId = actor.supervisorProfileId;
    } else if (actor.role === Role.ADMIN) {
      where.status = {
        in: [
          ReportStatus.SUBMITTED,
          ReportStatus.REVIEWED,
          ReportStatus.APPROVED,
          ReportStatus.REJECTED,
        ],
      };
    } else {
      throw new ForbiddenException('Không có quyền xem báo cáo');
    }

    const row = await this.prisma.dailyReport.findFirst({
      where,
      include: reportListInclude,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    return row;
  }

  async review(id: string, status: ReportStatus, userId: string) {
    const actor = await this.resolveActorContext(userId);
    if (actor?.role !== Role.ADMIN || !actor.adminId) {
      throw new ForbiddenException('Chỉ quản trị viên mới được duyệt báo cáo');
    }

    if (status !== ReportStatus.APPROVED && status !== ReportStatus.REJECTED) {
      throw new BadRequestException('Trạng thái duyệt không hợp lệ (APPROVED hoặc REJECTED)');
    }

    const existing = await this.prisma.dailyReport.findFirst({
      where: { id, adminId: actor.adminId },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    if (existing.status !== ReportStatus.SUBMITTED) {
      throw new BadRequestException('Chỉ có thể duyệt báo cáo đang ở trạng thái đã gửi (SUBMITTED)');
    }

    return this.prisma.dailyReport.update({
      where: { id },
      data: { status },
      include: reportListInclude,
    });
  }
}
