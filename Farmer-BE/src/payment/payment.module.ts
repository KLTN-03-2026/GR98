import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VnpayModule } from 'nestjs-vnpay';
import { ignoreLogger } from 'vnpay';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    PrismaModule,
    VnpayModule.register({
      tmnCode: process.env.VNPAY_TMN_CODE || '',
      secureSecret: process.env.VNPAY_SECURE_SECRET || '',
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      // hashAlgorithm mặc định là SHA512, không cần truyền
      enableLog: true,
      loggerFn: ignoreLogger,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
