import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Patch,
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
import { ContractStatus, QualityGrade, Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import {
  RejectContractDto,
  UpdateContractDto,
} from './dto/update-contract.dto';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard, RolesGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @Roles(Role.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Supervisor tạo hợp đồng nháp' })
  @ApiResponse({ status: 201, description: 'Tạo hợp đồng thành công' })
  create(@Body() dto: CreateContractDto, @Request() req: any) {
    return this.contractService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách hợp đồng (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ContractStatus })
  @ApiQuery({ name: 'cropType', required: false, type: String })
  @ApiQuery({ name: 'grade', required: false, enum: QualityGrade })
  @ApiQuery({ name: 'farmerId', required: false, type: String })
  findAll(@Query() query: QueryContractDto, @Request() req: any) {
    return this.contractService.findAll(query, req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Chi tiết hợp đồng' })
  @ApiResponse({ status: 200, description: 'Thông tin hợp đồng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.contractService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supervisor cập nhật hợp đồng nháp' })
  @ApiResponse({ status: 200, description: 'Cập nhật hợp đồng thành công' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @Request() req: any,
  ) {
    return this.contractService.update(id, dto, req.user.id);
  }

  @Patch(':id/submit')
  @Roles(Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supervisor gửi hợp đồng nháp đầy đủ để admin phê duyệt',
  })
  submitForApproval(@Param('id') id: string, @Request() req: any) {
    return this.contractService.submitForApproval(id, req.user.id);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin phê duyệt hợp đồng' })
  approve(@Param('id') id: string, @Request() req: any) {
    return this.contractService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin từ chối hợp đồng, trả về nháp' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectContractDto,
    @Request() req: any,
  ) {
    return this.contractService.reject(id, dto, req.user.id);
  }
}
