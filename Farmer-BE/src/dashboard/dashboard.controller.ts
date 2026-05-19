import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminOverviewQueryDto } from './dto/admin-overview-query.dto';
import { DashboardOverviewQueryDto } from './dto/dashboard-overview-query.dto';
import { DiseaseHeatmapQueryDto } from './dto/disease-heatmap-query.dto';
import { DashboardService } from './dashboard.service';
import type {
  AdminDashboardOverviewDto,
  DashboardOverviewDto,
  DiseaseHeatmapDto,
} from './dashboard.types';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({
    summary: 'Tổng quan dashboard (KPI, timeseries, pie, hoạt động gần đây)',
    description:
      'ADMIN: toàn tenant. SUPERVISOR: chỉ dữ liệu trong phạm vi GS (nông dân / lô / HĐ / báo cáo / quét AI).',
  })
  getOverview(
    @Request() req: { user: { id: string } },
    @Query() query: DashboardOverviewQueryDto,
  ): Promise<DashboardOverviewDto> {
    return this.dashboardService.getOverview(req.user.id, query);
  }

  @Get('admin/overview')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Tổng quan dashboard chuyên sâu cho Admin',
    description:
      'Bao gồm các nhóm KPI TMĐT + vận hành nông nghiệp, timeseries đơn/revenue/hợp đồng, phân bổ trạng thái và hoạt động gần đây.',
  })
  getAdminOverview(
    @Request() req: { user: { id: string } },
    @Query() query: AdminOverviewQueryDto,
  ): Promise<AdminDashboardOverviewDto> {
    return this.dashboardService.getAdminOverview(req.user.id, query);
  }

  @Get('disease-heatmap')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({
    summary: 'Bản đồ nhiệt cảnh báo dịch bệnh theo khu vực (GIS)',
    description:
      'Tổng hợp các lô đất + lần quét AI Vision để hiển thị heatmap dịch bệnh ' +
      'theo vị trí. Trả về danh sách điểm (lat/lng/weight) + summary cảnh báo ' +
      'theo tỉnh + top bệnh trending. SUPERVISOR chỉ thấy lô do mình phụ trách.',
  })
  getDiseaseHeatmap(
    @Request() req: { user: { id: string } },
    @Query() query: DiseaseHeatmapQueryDto,
  ): Promise<DiseaseHeatmapDto> {
    return this.dashboardService.getDiseaseHeatmap(req.user.id, query);
  }
}
