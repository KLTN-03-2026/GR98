import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Dashboard tổng quan — KPI + giao dịch gần đây + đơn chờ' })
  @ApiResponse({ status: 200, description: 'Dữ liệu dashboard' })
  getDashboard(@Request() req: any) {
    return this.inventoryService.getDashboard(req.user);
  }

  @Get('dashboard/chart')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Dữ liệu biểu đồ giao dịch 7 ngày' })
  @ApiResponse({ status: 200, description: 'Dữ liệu chart (labels + inbound + outbound + adjustment)' })
  getChartData(@Request() req: any) {
    return this.inventoryService.getChartData(req.user);
  }
}
