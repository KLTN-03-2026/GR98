import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
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
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({
    summary: 'Dashboard tổng quan — KPI + giao dịch gần đây + đơn chờ',
  })
  @ApiResponse({ status: 200, description: 'Dữ liệu dashboard' })
  getDashboard(@Request() req: { user: any }) {
    return this.inventoryService.getDashboard(req.user);
  }

  @Get('dashboard/chart')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Dữ liệu biểu đồ giao dịch 7 ngày' })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu chart (labels + inbound + outbound + adjustment)',
  })
  getChartData(@Request() req: { user: any }) {
    return this.inventoryService.getChartData(req.user);
  }

  @Get('warehouses')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách kho được phân công' })
  @ApiResponse({ status: 200, description: 'Danh sách kho' })
  getWarehouses(@Request() req: { user: any }) {
    return this.inventoryService.getWarehouses(req.user);
  }

  @Get('warehouses/:id')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Chi tiết kho hàng — bao gồm lô hàng và giao dịch' })
  @ApiResponse({ status: 200, description: 'Chi tiết kho' })
  getWarehouseById(@Param('id') id: string, @Request() req: { user: any }) {
    return this.inventoryService.getWarehouseById(id, req.user);
  }

  @Post('warehouses')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tạo kho hàng (quản trị viên)' })
  @ApiResponse({ status: 201, description: 'Kho đã được tạo' })
  createWarehouse(
    @Request() req: { user: any },
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.inventoryService.createWarehouse(req.user, dto);
  }

  @Patch('warehouses/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật kho hàng / gán nhân viên kho (quản trị viên)' })
  @ApiResponse({ status: 200, description: 'Kho đã được cập nhật' })
  updateWarehouse(
    @Param('id') id: string,
    @Request() req: { user: any },
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.inventoryService.updateWarehouse(id, req.user, dto);
  }

  @Get('lots')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách lô hàng nhập kho' })
  @ApiResponse({ status: 200, description: 'Danh sách lô hàng' })
  getLots(
    @Request() req: { user: any },
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @Query('qualityGrade') qualityGrade?: string,
  ) {
    return this.inventoryService.getLots(req.user, {
      warehouseId,
      productId,
      qualityGrade,
    });
  }

  @Post('lots')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Nhập kho lô hàng mới' })
  @ApiResponse({ status: 201, description: 'Lô hàng đã được tạo' })
  createLot(@Request() req: { user: any }, @Body() data: any) {
    return this.inventoryService.createLot(req.user, data);
  }

  @Get('lots/:id')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Chi tiết lô hàng — Traceability' })
  @ApiResponse({ status: 200, description: 'Chi tiết lô hàng' })
  getLotById(@Param('id') id: string, @Request() req: { user: any }) {
    return this.inventoryService.getLotById(id, req.user);
  }

  @Get('products')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách sản phẩm nông sản' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  getProducts(@Request() req: { user: any }) {
    return this.inventoryService.getProducts(req.user);
  }

  @Get('contracts')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách hợp đồng đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Danh sách hợp đồng' })
  getActiveContracts(@Request() req: { user: any }) {
    return this.inventoryService.getActiveContracts(req.user);
  }

  @Get('transactions')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách giao dịch kho' })
  @ApiResponse({ status: 200, description: 'Danh sách giao dịch' })
  getTransactions(
    @Request() req: { user: any },
    @Query('warehouseId') warehouseId?: string,
    @Query('type') type?: string,
    @Query('productId') productId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getTransactions(req.user, {
      warehouseId,
      type,
      productId,
      fromDate,
      toDate,
    });
  }

  @Post('transactions')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Tạo giao dịch kho mới (Nhập/Xuất/Điều chỉnh)' })
  @ApiResponse({ status: 201, description: 'Giao dịch đã được tạo' })
  createTransaction(@Request() req: { user: any }, @Body() data: any) {
    return this.inventoryService.createTransaction(req.user, data);
  }

  @Get('supply-demand')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Báo cáo cung cầu' })
  @ApiResponse({ status: 200, description: 'Dữ liệu báo cáo cung cầu' })
  getSupplyDemand(
    @Request() req: { user: any },
    @Query('cropType') cropType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getSupplyDemand(req.user, {
      cropType,
      fromDate,
      toDate,
    });
  }
}
