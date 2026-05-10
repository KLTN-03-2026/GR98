import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'clxxx' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ enum: ['VNPAY', 'MOMO'] })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class SimulatePaymentDto {
  @ApiProperty({ example: 'clxxx' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'SIMULATED_OK' })
  @IsString()
  result: 'SUCCESS' | 'FAILED';
}
