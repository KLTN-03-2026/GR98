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
import { Role, FarmerStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { FarmerService } from './farmer.service';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { QueryFarmerDto } from './dto/query-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';

@ApiTags('farmers')
@ApiBearerAuth()
@Controller('farmers')
@UseGuards(AuthGuard, RolesGuard)
export class FarmerController {
  constructor(private readonly farmerService: FarmerService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo nông dân mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'CCCD/SĐT đã tồn tại' })
  create(@Body() dto: CreateFarmerDto, @Request() req: any) {
    return this.farmerService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Danh sách nông dân (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: FarmerStatus })
  @ApiQuery({ name: 'supervisorId', required: false, type: String })
  @ApiQuery({ name: 'province', required: false, type: String })
  findAll(@Query() query: QueryFarmerDto, @Request() req: any) {
    return this.farmerService.findAll(query, req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Chi tiết nông dân' })
  @ApiResponse({ status: 200, description: 'Thông tin nông dân' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.farmerService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật nông dân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFarmerDto,
    @Request() req: any,
  ) {
    return this.farmerService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa nông dân' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.farmerService.remove(id, req.user.id);
  }
}
