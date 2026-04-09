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
  ApiQuery,
} from '@nestjs/swagger';
import { PriceBoardService } from './price-board.service';
import { CreatePriceBoardDto, UpdatePriceBoardDto, PriceBoardQueryDto } from './dto/create-price-board.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('price-boards')
@ApiBearerAuth()
@Controller('price-boards')
@UseGuards(AuthGuard, RolesGuard)
export class PriceBoardController {
  constructor(private readonly priceBoardService: PriceBoardService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo bảng giá mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Bảng giá đã tồn tại' })
  create(@Body() dto: CreatePriceBoardDto, @Request() req: any) {
    return this.priceBoardService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Danh sách bảng giá (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cropType', required: false, type: String })
  @ApiQuery({ name: 'grade', required: false, enum: Role })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  findAll(@Query() query: PriceBoardQueryDto, @Request() req: any) {
    return this.priceBoardService.findAll(query, req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Chi tiết bảng giá' })
  @ApiResponse({ status: 200, description: 'Thông tin bảng giá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.priceBoardService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật bảng giá' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePriceBoardDto,
    @Request() req: any,
  ) {
    return this.priceBoardService.update(id, dto, req.user.id);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bật / tắt trạng thái bảng giá' })
  @ApiResponse({ status: 200, description: 'Trạng thái đã được thay đổi' })
  toggleActive(@Param('id') id: string, @Request() req: any) {
    return this.priceBoardService.toggleActive(id, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa bảng giá' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.priceBoardService.remove(id, req.user.id);
  }
}
