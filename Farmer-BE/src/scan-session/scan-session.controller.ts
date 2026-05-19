import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ScanSessionService } from './scan-session.service';
import {
  CloseScanSessionDto,
  CreateScanSessionDto,
} from './dto/scan-session.dto';

@ApiTags('scan-sessions')
@ApiBearerAuth()
@Controller('scan-sessions')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERVISOR)
export class ScanSessionController {
  constructor(private readonly service: ScanSessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo phiên quét mới cho 1 plot' })
  create(@Body() dto: CreateScanSessionDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách phiên quét' })
  @ApiQuery({ name: 'plotId', required: false })
  findAll(@Request() req: any, @Query('plotId') plotId?: string) {
    return this.service.findAll(req.user.id, plotId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy phiên OPEN hiện tại của 1 plot (nếu có)' })
  @ApiQuery({ name: 'plotId', required: true })
  getActive(@Query('plotId') plotId: string, @Request() req: any) {
    return this.service.getActiveForPlot(plotId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phiên quét (kèm danh sách scan)' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.id);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đóng phiên — tính severity và lưu summary' })
  close(
    @Param('id') id: string,
    @Body() dto: CloseScanSessionDto,
    @Request() req: any,
  ) {
    return this.service.close(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Huỷ phiên đang mở' })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.service.cancel(id, req.user.id);
  }
}
