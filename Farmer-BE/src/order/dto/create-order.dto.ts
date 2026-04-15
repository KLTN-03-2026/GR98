import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus, FulfillStatus } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty({ example: 'clxxx123', description: 'ID sản phẩm' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Số lượng (kg)' })
  @IsNumber()
  @IsPositive()
  quantityKg: number;
}

export class ShippingAddrDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123 Nguyễn Trãi, Phường 5' })
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @ApiPropertyOptional({ example: 'Quận 3' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty()
  province: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Danh sách sản phẩm' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: ShippingAddrDto })
  @ValidateNested()
  @Type(() => ShippingAddrDto)
  shippingAddr: ShippingAddrDto;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: 'clxxx',
    description: 'ID địa chỉ giao hàng đã lưu (optional)',
  })
  @IsOptional()
  @IsString()
  savedAddressId?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: FulfillStatus })
  @IsOptional()
  @IsEnum(FulfillStatus)
  fulfillStatus?: FulfillStatus;

  @ApiPropertyOptional({ example: 'GHTK-1234567890' })
  @IsOptional()
  @IsString()
  trackingCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: FulfillStatus })
  @IsOptional()
  @IsEnum(FulfillStatus)
  fulfillStatus?: FulfillStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Chỉ đơn hàng của client hiện tại',
  })
  @IsOptional()
  @IsString()
  myOrders?: string;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Từ ngày (orderedAt)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-04-30',
    description: 'Đến ngày (orderedAt)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Tôi muốn hủy vì thay đổi ý định' })
  @IsOptional()
  @IsString()
  reason?: string;
}
