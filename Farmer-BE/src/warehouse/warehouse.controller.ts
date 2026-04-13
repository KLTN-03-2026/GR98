import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto, WarehouseQueryDto } from './dto/create-warehouse.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('warehouses')
@ApiBearerAuth()
@Controller('warehouses')
@UseGuards(AuthGuard, RolesGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo kho hàng mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreateWarehouseDto, @Request() req: any) {
    return this.warehouseService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách kho hàng (phân trang)' })
  findAll(@Query() query: WarehouseQueryDto, @Request() req: any) {
    return this.warehouseService.findAll(query, req.user.id);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Thống kê tổng quan kho' })
  getStats(@Request() req: any) {
    return this.warehouseService.getStats(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Chi tiết kho hàng' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.warehouseService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật kho hàng' })
  update(@Param('id') id: string, @Body() dto: CreateWarehouseDto, @Request() req: any) {
    return this.warehouseService.update(id, dto, req.user.id);
  }
}
