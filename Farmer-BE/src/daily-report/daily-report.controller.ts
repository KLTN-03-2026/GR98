import {
  Body,
  Controller,
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
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DailyReportService } from './daily-report.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { QueryDailyReportDto } from './dto/query-daily-report.dto';

@ApiTags('daily-reports')
@ApiBearerAuth()
@Controller('daily-reports')
@UseGuards(AuthGuard, RolesGuard)
export class DailyReportController {
  constructor(private readonly dailyReportService: DailyReportService) {}

  @Post()
  @Roles(Role.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Giám sát viên tạo báo cáo nháp' })
  create(@Body() dto: CreateDailyReportDto, @Request() req: { user: { id: string } }) {
    return this.dailyReportService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Danh sách báo cáo (admin: mặc định đã gửi; sup: của mình)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supervisorId', required: false })
  @ApiQuery({ name: 'plotId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: QueryDailyReportDto, @Request() req: { user: { id: string } }) {
    return this.dailyReportService.findAll(query, req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Chi tiết báo cáo' })
  findOne(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.dailyReportService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật báo cáo nháp' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDailyReportDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.dailyReportService.update(id, dto, req.user.id);
  }

  @Post(':id/submit')
  @Roles(Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi báo cáo (nháp → đã gửi), kiểm tra nội dung + ảnh' })
  @ApiResponse({ status: 400, description: 'Thiếu nội dung hoặc ảnh' })
  submit(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.dailyReportService.submit(id, req.user.id);
  }

  @Patch(':id/review')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin duyệt hoặc từ chối báo cáo' })
  review(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Request() req: { user: { id: string } },
  ) {
    return this.dailyReportService.review(id, status as any, req.user.id);
  }
}
