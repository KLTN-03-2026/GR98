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
import { WarehouseTransactionService } from './warehouse-transaction.service';
import { CreateWarehouseTransactionDto, WarehouseTransactionQueryDto } from './dto/create-warehouse-transaction.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('warehouse-transactions')
@ApiBearerAuth()
@Controller('warehouse-transactions')
@UseGuards(AuthGuard, RolesGuard)
export class WarehouseTransactionController {
  constructor(private readonly transactionService: WarehouseTransactionService) {}

  @Post()
  @Roles(Role.INVENTORY, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo giao dịch kho (xuất kho / điều chỉnh)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreateWarehouseTransactionDto, @Request() req: any) {
    return this.transactionService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.INVENTORY, Role.ADMIN)
  @ApiOperation({ summary: 'Danh sách giao dịch kho (phân trang)' })
  findAll(@Query() query: WarehouseTransactionQueryDto, @Request() req: any) {
    return this.transactionService.findAll(query, req.user.id);
  }

  @Get('recent')
  @Roles(Role.INVENTORY, Role.ADMIN)
  @ApiOperation({ summary: 'Giao dịch gần đây' })
  getRecent(@Request() req: any) {
    return this.transactionService.getRecent(req.user.id);
  }
}
