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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PlantScanService } from './plant-scan.service';
import { CreatePlantScanDto } from './dto/create-plant-scan.dto';
import { QueryPlantScanDto } from './dto/query-plant-scan.dto';

@ApiTags('plant-scans')
@ApiBearerAuth()
@Controller('plant-scans')
@UseGuards(AuthGuard, RolesGuard)
export class PlantScanController {
  constructor(private readonly plantScanService: PlantScanService) {}

  /** PWA gọi endpoint này ngay sau khi AI trả kết quả — tự động lưu */
  @Post()
  @Roles(Role.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Lưu kết quả quét bệnh cây trồng AI (tự động từ PWA)' })
  create(
    @Body() dto: CreatePlantScanDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.plantScanService.create(dto, req.user.id);
  }

  /** Dashboard supervisor xem lịch sử quét + stats */
  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Danh sách lịch sử quét AI + thống kê dashboard' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'dangerLevel', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'plotId', required: false })
  @ApiQuery({ name: 'supervisorId', required: false, description: 'Admin only' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @Query() query: QueryPlantScanDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.plantScanService.findAll(query, req.user.id);
  }

  /** Chi tiết 1 lần quét */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Chi tiết kết quả quét AI' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.plantScanService.findOne(id, req.user.id);
  }
}
