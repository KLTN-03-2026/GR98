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
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { QuerySupervisorDto } from './dto/query-supervisor.dto';
import { UpdateSupervisorDto } from './dto/update-supervisor.dto';
import { SupervisorService } from './supervisor.service';

@ApiTags('supervisors')
@ApiBearerAuth()
@Controller('supervisors')
@UseGuards(AuthGuard, RolesGuard)
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo giám sát viên (role SUPERVISOR)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Email/SĐT đã tồn tại' })
  create(@Body() dto: CreateSupervisorDto, @Request() req: any) {
    return this.supervisorService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Danh sách giám sát viên (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'zoneId', required: false, type: String })
  findAll(@Query() query: QuerySupervisorDto, @Request() req: any) {
    return this.supervisorService.findAll(query, req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Chi tiết giám sát viên' })
  @ApiResponse({ status: 200, description: 'Thông tin giám sát viên' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.supervisorService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật giám sát viên' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupervisorDto,
    @Request() req: any,
  ) {
    return this.supervisorService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa giám sát viên' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.supervisorService.remove(id, req.user.id);
  }
}
