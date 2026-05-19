import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MomoService } from './momo.service';

/**
 * Endpoint webhook server-to-server cho MoMo gọi vào sau khi user xác nhận
 * thanh toán. KHÔNG có auth guard vì MoMo không gửi JWT — bảo vệ bằng chữ ký
 * HMAC-SHA256 kiểm tra trong `MomoService.handleIpn`.
 *
 * URL public phải reachable từ internet:
 *   - Local dev: dùng ngrok hoặc Cloudflare tunnel.
 *   - Production: domain HTTPS thật.
 * Nếu không cấu hình `MOMO_IPN_URL`, MoMo không gọi tới đây — trạng thái đơn
 * vẫn được cập nhật qua redirect (FE gọi /payment/momo/verify sau khi user về).
 */
@ApiTags('payment-webhook')
@Controller('payment/momo')
export class MomoWebhookController {
  private readonly logger = new Logger(MomoWebhookController.name);

  constructor(private readonly momoService: MomoService) {}

  @Post('ipn')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'MoMo IPN callback (server-to-server)' })
  async handleIpn(@Body() payload: any) {
    this.logger.log(`MoMo IPN received: ${JSON.stringify(payload)}`);
    return this.momoService.handleIpn(payload);
  }
}
