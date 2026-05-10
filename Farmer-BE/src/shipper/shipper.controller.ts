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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShipperService } from './shipper.service';
import {
  CreateShipperDto,
  QueryShipperDto,
  UpdateLocationDto,
  UpdateShipperDto,
} from './dto/shipper.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('shippers')
@ApiBearerAuth()
@Controller('shippers')
@UseGuards(AuthGuard)
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  // ─── Admin CRUD ──────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Tạo shipper mới (Admin)' })
  create(
    @Body() dto: CreateShipperDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.shipperService.create(dto, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách shipper' })
  findAll(
    @Query() query: QueryShipperDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.shipperService.findAll(query, req.user.id);
  }

  // ─── Shipper self-service ───────────────────────────────────────────

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.SHIPPER)
  @ApiOperation({ summary: 'Hồ sơ shipper của tôi' })
  getMyProfile(@Request() req: { user: { id: string } }) {
    return this.shipperService.getMyProfile(req.user.id);
  }

  @Get('me/orders')
  @UseGuards(RolesGuard)
  @Roles(Role.SHIPPER)
  @ApiOperation({ summary: 'Đơn được gán cho tôi' })
  getMyOrders(
    @Query('status') status: string | undefined,
    @Request() req: { user: { id: string } },
  ) {
    return this.shipperService.getMyOrders(req.user.id, status);
  }

  @Post('me/location')
  @UseGuards(RolesGuard)
  @Roles(Role.SHIPPER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật vị trí GPS' })
  updateLocation(
    @Body() dto: UpdateLocationDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.shipperService.updateLocation(req.user.id, dto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.INVENTORY)
  @ApiOperation({ summary: 'Chi tiết shipper' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.shipperService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Cập nhật shipper' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShipperDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.shipperService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa shipper' })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.shipperService.remove(id, req.user.id);
  }
}
