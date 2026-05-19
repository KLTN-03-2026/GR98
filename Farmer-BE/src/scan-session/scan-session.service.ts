import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ScanSessionStatus } from '@prisma/client';
import { CloseScanSessionDto, CreateScanSessionDto } from './dto/scan-session.dto';

interface Actor {
  userId: string;
  role: Role;
  adminId: string;
  supervisorProfileId: string | null;
}

@Injectable()
export class ScanSessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Bắt đầu 1 phiên quét cho 1 plot. Mỗi plot chỉ có tối đa 1 phiên OPEN
   * cùng lúc — nếu đã có phiên OPEN, trả về luôn (không tạo trùng).
   */
  async create(dto: CreateScanSessionDto, currentUserId: string) {
    const actor = await this.resolveActor(currentUserId);
    if (actor.role !== Role.SUPERVISOR || !actor.supervisorProfileId) {
      throw new ForbiddenException('Chỉ giám sát viên mới được tạo phiên quét');
    }

    // Kiểm tra plot có thuộc phạm vi supervisor không.
    const plot = await this.prisma.plot.findFirst({
      where: {
        id: dto.plotId,
        adminId: actor.adminId,
        assignments: {
          some: {
            supervisorId: actor.supervisorProfileId,
            status: 'ACTIVE',
          },
        },
      },
      select: { id: true },
    });
    if (!plot) {
      throw new ForbiddenException(
        'Lô đất không thuộc phạm vi phụ trách hoặc không tồn tại',
      );
    }

    // Nếu đã có phiên OPEN cho plot này — trả về luôn để supervisor tiếp tục.
    const existingOpen = await this.prisma.scanSession.findFirst({
      where: {
        plotId: dto.plotId,
        supervisorId: actor.supervisorProfileId,
        status: ScanSessionStatus.OPEN,
      },
    });
    if (existingOpen) return existingOpen;

    return this.prisma.scanSession.create({
      data: {
        adminId: actor.adminId,
        supervisorId: actor.supervisorProfileId,
        plotId: dto.plotId,
        note: dto.note ?? null,
      },
    });
  }

  /** Lấy phiên OPEN hiện tại của supervisor cho 1 plot (nếu có). */
  async getActiveForPlot(plotId: string, currentUserId: string) {
    const actor = await this.resolveActor(currentUserId);
    if (!actor.supervisorProfileId) return null;

    return this.prisma.scanSession.findFirst({
      where: {
        plotId,
        supervisorId: actor.supervisorProfileId,
        status: ScanSessionStatus.OPEN,
      },
      include: {
        _count: { select: { scans: true } },
      },
    });
  }

  /** Chi tiết 1 phiên — kèm danh sách scan và breakdown bệnh. */
  async findOne(id: string, currentUserId: string) {
    const actor = await this.resolveActor(currentUserId);
    const session = await this.prisma.scanSession.findFirst({
      where: {
        id,
        adminId: actor.adminId,
        ...(actor.role === Role.SUPERVISOR
          ? { supervisorId: actor.supervisorProfileId ?? undefined }
          : {}),
      },
      include: {
        scans: {
          orderBy: { scannedAt: 'asc' },
          select: {
            id: true,
            diseaseEn: true,
            diseaseVi: true,
            dangerLevel: true,
            category: true,
            confidence: true,
            scannedAt: true,
            imageDataUrl: true,
          },
        },
        plot: { select: { id: true, plotCode: true, areaHa: true, cropType: true } },
        recommendations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!session) {
      throw new NotFoundException('Phiên quét không tồn tại');
    }
    return session;
  }

  /**
   * Đóng phiên quét: tính tổng số ảnh, số cây nhiễm, severity, breakdown
   * theo từng bệnh, lưu vào session. Sau khi đóng, supervisor có thể gọi
   * AI Advisor (Phase 4) để sinh khuyến nghị xử lý.
   */
  async close(id: string, dto: CloseScanSessionDto, currentUserId: string) {
    const actor = await this.resolveActor(currentUserId);
    const session = await this.prisma.scanSession.findFirst({
      where: {
        id,
        adminId: actor.adminId,
        ...(actor.role === Role.SUPERVISOR
          ? { supervisorId: actor.supervisorProfileId ?? undefined }
          : {}),
      },
      include: {
        scans: { select: { diseaseEn: true, diseaseVi: true, category: true } },
      },
    });
    if (!session) {
      throw new NotFoundException('Phiên quét không tồn tại');
    }
    if (session.status !== ScanSessionStatus.OPEN) {
      throw new BadRequestException('Phiên đã được đóng trước đó');
    }
    if (session.scans.length === 0) {
      throw new BadRequestException(
        'Chưa có ảnh nào trong phiên — vui lòng quét ít nhất 1 cây trước khi đóng',
      );
    }

    // Tổng hợp: đếm theo diseaseVi để FE hiển thị dễ đọc. Cây "healthy" (lá
    // khoẻ) không tính là nhiễm.
    const summary: Record<string, number> = {};
    let infectedCount = 0;
    for (const scan of session.scans) {
      const key = scan.diseaseVi || scan.diseaseEn || 'Unknown';
      summary[key] = (summary[key] ?? 0) + 1;
      if (scan.category && scan.category.toLowerCase() !== 'healthy') {
        infectedCount += 1;
      }
    }
    const totalScans = session.scans.length;
    const infectedRatio = totalScans > 0 ? infectedCount / totalScans : 0;
    // Ngưỡng severity tham khảo theo cách phân loại nông học phổ biến.
    // Có thể điều chỉnh sau khi tham vấn kỹ sư.
    const severity =
      infectedRatio === 0
        ? 'none'
        : infectedRatio < 0.2
          ? 'light'
          : infectedRatio < 0.5
            ? 'medium'
            : 'severe';

    return this.prisma.scanSession.update({
      where: { id },
      data: {
        status: ScanSessionStatus.CLOSED,
        closedAt: new Date(),
        totalScans,
        infectedCount,
        severity,
        diseaseSummary: summary,
        note: dto.note ?? session.note,
      },
    });
  }

  /** Huỷ phiên — supervisor không muốn tiếp tục. */
  async cancel(id: string, currentUserId: string) {
    const actor = await this.resolveActor(currentUserId);
    const session = await this.prisma.scanSession.findFirst({
      where: {
        id,
        adminId: actor.adminId,
        ...(actor.role === Role.SUPERVISOR
          ? { supervisorId: actor.supervisorProfileId ?? undefined }
          : {}),
      },
    });
    if (!session) throw new NotFoundException('Phiên quét không tồn tại');
    if (session.status !== ScanSessionStatus.OPEN) {
      throw new BadRequestException('Chỉ phiên đang mở mới được huỷ');
    }
    return this.prisma.scanSession.update({
      where: { id },
      data: { status: ScanSessionStatus.CANCELLED, closedAt: new Date() },
    });
  }

  /** Danh sách phiên — admin xem all, supervisor chỉ thấy của mình. */
  async findAll(currentUserId: string, plotId?: string) {
    const actor = await this.resolveActor(currentUserId);
    return this.prisma.scanSession.findMany({
      where: {
        adminId: actor.adminId,
        ...(actor.role === Role.SUPERVISOR
          ? { supervisorId: actor.supervisorProfileId ?? undefined }
          : {}),
        ...(plotId ? { plotId } : {}),
      },
      include: {
        plot: { select: { plotCode: true, cropType: true, areaHa: true } },
        _count: { select: { scans: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  // ─── Helper ───────────────────────────────────────────────────────────

  private async resolveActor(userId: string): Promise<Actor> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: { select: { id: true } },
        supervisorProfile: { select: { id: true, adminId: true } },
      },
    });
    if (!user) throw new ForbiddenException('Người dùng không tồn tại');

    let adminId = '';
    if (user.role === Role.ADMIN) {
      adminId = user.adminProfile?.id ?? '';
    } else if (user.role === Role.SUPERVISOR && user.supervisorProfile) {
      adminId = user.supervisorProfile.adminId;
    }
    if (!adminId) {
      throw new ForbiddenException('Không xác định được tenant của người dùng');
    }

    return {
      userId,
      role: user.role,
      adminId,
      supervisorProfileId: user.supervisorProfile?.id ?? null,
    };
  }
}
