import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { MomoService } from './momo.service';
import { CreatePaymentDto, SimulatePaymentDto } from './dto/payment.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.CLIENT)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly momoService: MomoService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tạo phiên thanh toán VNPay' })
  createSession(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.paymentService.createPaymentSession(dto, req.user.id);
  }

  @Get('vnpay/verify')
  @ApiOperation({ summary: 'Xác thực callback từ VNPay (return URL)' })
  verifyReturnUrl(@Query() query: Record<string, string>) {
    return this.paymentService.verifyReturnUrl(query);
  }

  @Get('momo/verify')
  @ApiOperation({ summary: 'Xác thực callback từ MoMo (return URL)' })
  verifyMomoReturn(@Query() query: Record<string, string>) {
    return this.momoService.verifyRedirect(query);
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Callback giả lập - set PAID/FAILED' })
  simulate(
    @Body() dto: SimulatePaymentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.paymentService.simulate(dto, req.user.id);
  }
}
