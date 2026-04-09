import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const user = (process.env.SMTP_USER ?? '').trim();
    // App Password: bỏ mọi khoảng trắng (Google hiển thị dạng xxxx xxxx xxxx xxxx)
    const pass = (process.env.SMTP_PASS ?? '').replace(/\s+/g, '').trim();

    if (!user || !pass) {
      this.logger.warn(
        'SMTP_USER hoặc SMTP_PASS chưa được set — kiểm tra file .env và restart server.',
      );
    }

    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';

    // Gmail: dùng preset "gmail" thường ổn định hơn với App Password
    if (host === 'smtp.gmail.com' || host === '') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        requireTLS: !secure && port === 587,
      });
    }

    return this.transporter;
  }

  /** From: Gmail chỉ chấp nhận địa chỉ đã đăng nhập (trừ khi đã thêm "Send mail as") */
  private getFromAddress(): string {
    const user = (process.env.SMTP_USER ?? '').trim();
    const custom = (process.env.EMAIL_FROM ?? '').trim();
    if (custom && /@gmail\.com|@googlemail\.com/i.test(custom)) {
      return custom;
    }
    if (custom) {
      // Custom domain trong From + auth Gmail → dễ bị từ chối ở bước gửi; vẫn dùng user thật để gửi được
      this.logger.warn(
        'EMAIL_FROM khác domain Gmail — dùng SMTP_USER làm From để tránh lỗi Gmail.',
      );
    }
    return `Farmers <${user}>`;
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    fullName: string,
  ) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .body { padding: 30px; }
    .body p { color: #333333; line-height: 1.6; margin: 0 0 15px; }
    .button { display: inline-block; background: #22c55e; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #888888; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; font-size: 14px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Farmers</h1>
    </div>
    <div class="body">
      <p>Xin chào <strong>${fullName}</strong>,</p>
      <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Đặt lại mật khẩu</a>
      </p>
      <div class="warning">
        ⚠️ Link này sẽ hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
      </div>
      <p style="font-size: 14px; color: #666;">Hoặc copy link sau vào trình duyệt:</p>
      <p style="font-size: 12px; word-break: break-all; color: #22c55e;">${resetLink}</p>
    </div>
    <div class="footer">
      <p>Email này được gửi tự động từ hệ thống Farmers.</p>
      <p>© 2026 Farmers. Mọi thắc mắc liên hệ: support@farmers.vn</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.getTransporter().sendMail({
      from: this.getFromAddress(),
      to: email,
      subject: 'Đặt lại mật khẩu - Farmers',
      html: htmlContent,
    });
  }
}
