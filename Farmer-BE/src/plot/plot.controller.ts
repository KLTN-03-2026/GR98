import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
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
import { Role } from '@prisma/client';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PlotService } from './plot.service';
import { CreatePlotDto, PlotQueryDto, UpdatePlotDto } from './dto/plot.dto';

@ApiTags('plots')
@ApiBearerAuth()
@Controller('plots')
@UseGuards(AuthGuard, RolesGuard)
export class PlotController {
  constructor(private readonly plotService: PlotService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lô đất từ GIS sheet' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreatePlotDto, @Request() req: any) {
    return this.plotService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật lô đất (đổi supervisor phụ trách)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlotDto,
    @Request() req: any,
  ) {
    return this.plotService.update(id, dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách lô đất (tenant scoped)' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'cropType', required: false, type: String })
  @ApiQuery({ name: 'id_suppervisor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Danh sách phân trang' })
  findAll(@Query() query: PlotQueryDto, @Request() req: any) {
    return this.plotService.findAll(query, req.user.id);
  }
}
