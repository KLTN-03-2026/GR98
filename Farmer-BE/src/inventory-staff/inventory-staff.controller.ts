import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateInventoryStaffDto } from './dto/create-inventory-staff.dto';
import { QueryInventoryStaffDto } from './dto/query-inventory-staff.dto';
import { UpdateInventoryStaffDto } from './dto/update-inventory-staff.dto';
import { InventoryStaffService } from './inventory-staff.service';

@ApiTags('inventory-staff')
@ApiBearerAuth()
@Controller('inventory-staff')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryStaffController {
  constructor(private readonly inventoryStaffService: InventoryStaffService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo nhân viên kho (role INVENTORY)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Email/SĐT đã tồn tại' })
  create(@Body() dto: CreateInventoryStaffDto, @Request() req: any) {
    return this.inventoryStaffService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Danh sách nhân viên kho (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  findAll(@Query() query: QueryInventoryStaffDto, @Request() req: any) {
    return this.inventoryStaffService.findAll(query, req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Chi tiết nhân viên kho' })
  @ApiResponse({ status: 200, description: 'Thông tin nhân viên kho' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.inventoryStaffService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật nhân viên kho' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryStaffDto,
    @Request() req: any,
  ) {
    return this.inventoryStaffService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa nhân viên kho' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.inventoryStaffService.remove(id, req.user.id);
  }
}
