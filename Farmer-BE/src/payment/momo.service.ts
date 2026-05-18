import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FulfillStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * Tích hợp cổng thanh toán MoMo Wallet — flow "One-Time Payment" (captureWallet).
 *
 * Tham khảo:
 *   - https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime/
 *   - https://github.com/momo-wallet/payment
 *
 * Luồng:
 *   1. FE checkout chọn MOMO → BE gọi createPayment() → MoMo trả về payUrl.
 *   2. FE redirect user tới payUrl → user mở app MoMo (hoặc quét QR) → xác nhận.
 *   3a. MoMo redirect browser về `redirectUrl` (client-side return) → FE đọc kết quả.
 *   3b. MoMo gọi `ipnUrl` (server-to-server) → BE verify chữ ký + cập nhật trạng thái.
 *       Khi public URL (production hoặc ngrok); dev local có thể bỏ qua IPN.
 *
 * Chữ ký:
 *   - HMAC SHA256 trên rawSignature (các field theo thứ tự alphabet).
 *   - Secret key chỉ dùng ở BE — KHÔNG bao giờ expose ra FE.
 */
interface MomoCreateResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

interface MomoIpnPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);

  private readonly partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
  private readonly accessKey = process.env.MOMO_ACCESS_KEY || '';
  private readonly secretKey = process.env.MOMO_SECRET_KEY || '';
  private readonly endpoint =
    process.env.MOMO_ENDPOINT ||
    'https://test-payment.momo.vn/v2/gateway/api/create';
  // IPN có thể rỗng ở dev local — khi đó MoMo không gọi tới, ta dựa hoàn toàn
  // vào redirect URL để cập nhật trạng thái đơn.
  private readonly ipnUrl = process.env.MOMO_IPN_URL || '';

  constructor(private prisma: PrismaService) {}

  /** Tạo phiên thanh toán MoMo cho 1 order — trả về payUrl để FE redirect. */
  async createPayment(orderId: string, clientId: string) {
    if (!this.accessKey || !this.secretKey) {
      throw new BadRequestException(
        'MoMo chưa được cấu hình (thiếu ACCESS_KEY hoặc SECRET_KEY)',
      );
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, clientId },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn đã thanh toán');
    }

    // MoMo yêu cầu orderId duy nhất qua mỗi lần request (idempotency). Append
    // timestamp để có thể retry nếu user huỷ lần trước rồi quay lại.
    const momoOrderId = `${order.orderNo}-${Date.now()}`;
    const requestId = momoOrderId;
    const amount = Math.round(order.total).toString();
    const orderInfo = `Thanh toan don hang ${order.orderNo}`;
    const extraData = ''; // base64-encoded JSON nếu cần truyền context phụ
    const requestType = 'captureWallet';
    const feBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${feBase}/payment/result?gateway=momo`;
    const ipnUrl = this.ipnUrl || redirectUrl;

    // Raw signature: field sắp xếp theo thứ tự alphabet đúng spec MoMo.
    const rawSignature =
      `accessKey=${this.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${this.partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const body = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    let response: MomoCreateResponse;
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      response = (await res.json()) as MomoCreateResponse;
    } catch (err) {
      this.logger.error('MoMo create payment failed', err);
      throw new BadRequestException(
        'Không thể kết nối cổng thanh toán MoMo. Vui lòng thử lại.',
      );
    }

    if (response.resultCode !== 0 || !response.payUrl) {
      this.logger.warn(
        `MoMo create rejected: code=${response.resultCode}, msg=${response.message}`,
      );
      throw new BadRequestException(
        `Cổng MoMo từ chối tạo phiên thanh toán: ${response.message}`,
      );
    }

    // Lưu mã giao dịch MoMo vào order để đối chiếu khi IPN/return về sau.
    // Field `note` được tận dụng vì schema chưa có `paymentRef`.
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: PaymentMethod.MOMO,
        note: this.attachMomoRef(order.note, momoOrderId),
      },
    });

    return {
      paymentUrl: response.payUrl,
      qrCodeUrl: response.qrCodeUrl,
      deeplink: response.deeplink,
      method: PaymentMethod.MOMO,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.total,
      momoOrderId,
    };
  }

  /**
   * Verify chữ ký + cập nhật trạng thái đơn dựa trên callback IPN từ MoMo.
   * Gọi từ controller khi MoMo POST tới `/payment/momo/ipn`.
   */
  async handleIpn(payload: MomoIpnPayload) {
    const expected = this.signIpn(payload);
    if (expected !== payload.signature) {
      this.logger.warn('MoMo IPN signature mismatch');
      // Trả 204 dù sai chữ ký để MoMo không retry vô hạn — nhưng KHÔNG cập nhật DB.
      return { ok: false, reason: 'invalid_signature' };
    }

    const orderNo = this.extractOrderNo(payload.orderId);
    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      this.logger.warn(`MoMo IPN: order not found ${orderNo}`);
      return { ok: false, reason: 'order_not_found' };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      // Đã được set PAID trước đó (vd. redirect xử lý trước IPN) — không làm gì.
      return { ok: true, reason: 'already_paid' };
    }

    if (payload.resultCode === 0) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });
      return { ok: true };
    }

    // Thất bại (user huỷ / hết hạn / lỗi)
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
          cancelReason: `MoMo: ${payload.message || 'Giao dịch không thành công'}`,
        },
      });
    }
    return { ok: false, reason: 'payment_failed', code: payload.resultCode };
  }

  /**
   * Xác thực query trên redirect URL — dùng khi user browser quay về FE
   * sau khi xác nhận thanh toán trên MoMo. FE gửi query qua endpoint này.
   */
  async verifyRedirect(query: Record<string, string>) {
    const expected = this.signIpn({
      partnerCode: query.partnerCode,
      orderId: query.orderId,
      requestId: query.requestId,
      amount: Number(query.amount),
      orderInfo: query.orderInfo,
      orderType: query.orderType,
      transId: Number(query.transId),
      resultCode: Number(query.resultCode),
      message: query.message,
      payType: query.payType,
      responseTime: Number(query.responseTime),
      extraData: query.extraData ?? '',
    });

    const orderNo = this.extractOrderNo(query.orderId);
    const order = orderNo
      ? await this.prisma.order.findUnique({ where: { orderNo } })
      : null;

    if (expected !== query.signature) {
      return {
        isSuccess: false,
        message: 'Chữ ký MoMo không hợp lệ. Giao dịch có thể đã bị giả mạo.',
        orderNo,
      };
    }
    if (!order) {
      return { isSuccess: false, message: 'Đơn hàng không tồn tại', orderNo };
    }

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

    const resultCode = Number(query.resultCode);
    if (resultCode !== 0) {
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
            cancelReason: `MoMo: ${query.message || 'Giao dịch không thành công'}`,
          },
        });
      }
      return {
        isSuccess: false,
        message: query.message || 'Giao dịch không thành công',
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.total,
        paymentMethod: order.paymentMethod,
      };
    }

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

  // ─── Helpers ────────────────────────────────────────────────────────────

  /** Ký HMAC-SHA256 trên rawSignature của IPN/redirect (cùng spec). */
  private signIpn(p: Omit<MomoIpnPayload, 'signature'>): string {
    const raw =
      `accessKey=${this.accessKey}` +
      `&amount=${p.amount}` +
      `&extraData=${p.extraData}` +
      `&message=${p.message}` +
      `&orderId=${p.orderId}` +
      `&orderInfo=${p.orderInfo}` +
      `&orderType=${p.orderType}` +
      `&partnerCode=${p.partnerCode}` +
      `&payType=${p.payType}` +
      `&requestId=${p.requestId}` +
      `&responseTime=${p.responseTime}` +
      `&resultCode=${p.resultCode}` +
      `&transId=${p.transId}`;
    return createHmac('sha256', this.secretKey).update(raw).digest('hex');
  }

  /** Tách orderNo từ momoOrderId (`<orderNo>-<timestamp>`). */
  private extractOrderNo(momoOrderId: string): string {
    const lastDash = momoOrderId.lastIndexOf('-');
    return lastDash > 0 ? momoOrderId.slice(0, lastDash) : momoOrderId;
  }

  /** Lưu mã MoMo vào note để debug; không phá note cũ. */
  private attachMomoRef(existingNote: string | null, momoOrderId: string) {
    const tag = `[MOMO_REF:${momoOrderId}]`;
    if (!existingNote) return tag;
    if (existingNote.includes('[MOMO_REF:')) {
      return existingNote.replace(/\[MOMO_REF:[^\]]+\]/, tag);
    }
    return `${existingNote}\n${tag}`;
  }
}
