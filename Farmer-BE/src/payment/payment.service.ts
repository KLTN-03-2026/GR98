import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FulfillStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { VnpayService } from 'nestjs-vnpay';
import { CreatePaymentDto, SimulatePaymentDto } from './dto/payment.dto';
import { MomoService } from './momo.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
    private momoService: MomoService,
  ) {}

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

    // ── MoMo: delegate sang MomoService (giao tiếp REST với cổng MoMo) ──
    if (dto.method === PaymentMethod.MOMO) {
      return this.momoService.createPayment(order.id, clientProfile.id);
    }

    if (dto.method !== PaymentMethod.VNPAY) {
      throw new BadRequestException('Phương thức thanh toán chưa hỗ trợ');
    }

    const feBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const returnUrl = `${feBase}/payment/result`;

    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: order.total,
      vnp_IpAddr: '127.0.0.1',
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: order.orderNo,
      vnp_OrderInfo: `Thanh toan don hang ${order.orderNo}`,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentMethod: dto.method },
    });

    return {
      paymentUrl,
      method: dto.method,
      orderId: order.id,
      amount: order.total,
    };
  }

  async verifyReturnUrl(query: Record<string, string>) {
    const verify = await this.vnpayService.verifyReturnUrl(query as any);

    const orderNo = query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode;
    const order = orderNo
      ? await this.prisma.order.findUnique({ where: { orderNo } })
      : null;

    if (!verify.isVerified) {
      return {
        isSuccess: false,
        message: 'Chữ ký không hợp lệ. Giao dịch có thể đã bị giả mạo.',
        orderNo,
      };
    }

    if (!order) {
      return { isSuccess: false, message: 'Đơn hàng không tồn tại', orderNo };
    }

    // Đã thanh toán trước đó (callback lặp) → trả về kết quả cũ
    if (order.paymentStatus === PaymentStatus.PAID) {
      return {
        isSuccess: true,
        message: 'Đơn hàng đã được thanh toán',
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.total,
        paymentMethod: order.paymentMethod,
      };
    }

    // Giao dịch không thành công (user huỷ / hết hạn / lỗi)
    if (!verify.isSuccess) {
      const isUserCancel = responseCode === '24';
      const reason = isUserCancel
        ? 'Khách hàng hủy giao dịch'
        : `Giao dịch không thành công (mã ${responseCode || 'không rõ'})`;

      // Chỉ cập nhật khi đơn còn ở trạng thái có thể huỷ
      const cancellable =
        order.paymentStatus === PaymentStatus.PENDING &&
        (order.fulfillStatus === FulfillStatus.PENDING ||
          order.fulfillStatus === FulfillStatus.PACKING);

      if (cancellable) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            fulfillStatus: FulfillStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: reason,
          },
        });
      }

      return {
        isSuccess: false,
        message: reason,
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.total,
        paymentMethod: order.paymentMethod,
      };
    }

    // Thanh toán thành công
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    return {
      isSuccess: true,
      message: 'Thanh toán thành công',
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.total,
      paymentMethod: order.paymentMethod,
    };
  }

  /**
   * Tự động huỷ các đơn VNPAY đã PENDING quá 15 phút mà chưa thanh toán.
   * Gọi trước khi list đơn hàng để đảm bảo trạng thái luôn được làm mới.
   */
  async sweepExpiredVnpayOrders(thresholdMinutes = 15) {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    const result = await this.prisma.order.updateMany({
      where: {
        paymentMethod: PaymentMethod.VNPAY,
        paymentStatus: PaymentStatus.PENDING,
        fulfillStatus: { in: [FulfillStatus.PENDING, FulfillStatus.PACKING] },
        orderedAt: { lt: cutoff },
      },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        fulfillStatus: FulfillStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: 'Hết hạn thanh toán VNPay (15 phút)',
      },
    });
    return result.count;
  }

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
