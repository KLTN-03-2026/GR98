import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { CreatePaymentDto, SimulatePaymentDto } from './dto/payment.dto';

/**
 * Giả lập cổng thanh toán VNPay/MoMo.
 * Trong production sẽ thay bằng gọi API thật + xử lý IPN/callback.
 */
@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Trả về URL giả lập. Frontend sẽ redirect user tới URL này,
   * trang đó cho phép user bấm "Thanh toán thành công" / "Thất bại".
   */
  async createPaymentSession(dto: CreatePaymentDto, userId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) throw new ForbiddenException('Không có quyền');

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, clientId: clientProfile.id },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn đã thanh toán');
    }

    if (dto.method !== PaymentMethod.VNPAY && dto.method !== PaymentMethod.MOMO) {
      throw new BadRequestException('Phương thức không hỗ trợ cổng online');
    }

    const feBase = process.env.FE_BASE_URL || 'http://localhost:5173';
    const paymentRef = `SIM-${dto.method}-${Date.now()}`;

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentRef, paymentMethod: dto.method },
    });

    // FE sẽ có trang /payment/simulate?orderId=...&method=...&ref=...
    const redirectUrl = `${feBase}/payment/simulate?orderId=${order.id}&method=${dto.method}&ref=${paymentRef}&amount=${order.total}`;

    return {
      paymentUrl: redirectUrl,
      paymentRef,
      method: dto.method,
      orderId: order.id,
      amount: order.total,
    };
  }

  /**
   * Endpoint giả lập callback: FE bấm "thanh toán thành công"
   * hoặc "thất bại" → server set paymentStatus tương ứng.
   */
  async simulate(dto: SimulatePaymentDto, userId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) throw new ForbiddenException('Không có quyền');

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, clientId: clientProfile.id },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    if (dto.result === 'SUCCESS') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });
      return { ok: true, paymentStatus: 'PAID' };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.FAILED },
    });
    return { ok: false, paymentStatus: 'FAILED' };
  }
}
