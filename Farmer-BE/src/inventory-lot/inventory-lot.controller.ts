import {
  Controller,
  Get,
  Post,
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
import { InventoryLotService } from './inventory-lot.service';
import { CreateInventoryLotDto, InventoryLotQueryDto } from './dto/create-inventory-lot.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('inventory-lots')
@ApiBearerAuth()
@Controller('inventory-lots')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryLotController {
  constructor(private readonly inventoryLotService: InventoryLotService) {}

  @Post()
  @Roles(Role.INVENTORY, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Nhập kho - tạo lô hàng mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreateInventoryLotDto, @Request() req: any) {
    return this.inventoryLotService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.INVENTORY, Role.ADMIN)
  @ApiOperation({ summary: 'Danh sách lô hàng (phân trang)' })
  findAll(@Query() query: InventoryLotQueryDto, @Request() req: any) {
    return this.inventoryLotService.findAll(query, req.user.id);
  }

  @Get(':id')
  @Roles(Role.INVENTORY, Role.ADMIN)
  @ApiOperation({ summary: 'Chi tiết lô hàng' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.inventoryLotService.findOne(id, req.user.id);
  }
}
