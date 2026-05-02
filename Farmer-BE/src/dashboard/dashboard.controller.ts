import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminOverviewQueryDto } from './dto/admin-overview-query.dto';
import { DashboardOverviewQueryDto } from './dto/dashboard-overview-query.dto';
import { DashboardService } from './dashboard.service';
import type {
  AdminDashboardOverviewDto,
  DashboardOverviewDto,
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
}
