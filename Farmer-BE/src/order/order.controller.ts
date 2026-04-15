import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderQueryDto,
  CancelOrderDto,
} from './dto/create-order.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo đơn hàng mới (CLIENT)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.orderService.create(dto, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Danh sách đơn hàng' })
  @ApiResponse({ status: 200, description: 'Danh sách phân trang' })
  findAll(@Query() query: OrderQueryDto, @Request() req: any) {
    return this.orderService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.orderService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật đơn hàng (ADMIN/SUPERVISOR)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Request() req: any,
  ) {
    return this.orderService.update(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hủy đơn hàng (CLIENT)' })
  @ApiResponse({ status: 200, description: 'Hủy thành công' })
  @ApiResponse({ status: 400, description: 'Không thể hủy đơn đang xử lý' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Request() req: any,
  ) {
    return this.orderService.cancel(id, dto, req.user.id);
  }
}
