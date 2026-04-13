import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWarehouseTransactionDto {
  @ApiProperty({ example: 'warehouse-id' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: 'lot-id' })
  @IsString()
  @IsNotEmpty()
  inventoryLotId: string;

  @ApiProperty({ enum: ['outbound', 'adjustment'], example: 'outbound' })
  @IsEnum(['outbound', 'adjustment'])
  type: 'outbound' | 'adjustment';

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  quantityKg: number;

  @ApiPropertyOptional({ example: 'Xuất cho đơn hàng ĐH-20260409-001' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class WarehouseTransactionQueryDto {
  @ApiPropertyOptional({ default: '1' })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: '20' })
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ example: 'warehouse-id' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ example: 'product-id' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ enum: ['inbound', 'outbound', 'adjustment'], example: 'inbound' })
  @IsEnum(['inbound', 'outbound', 'adjustment'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ enum: ['today', 'week', 'month'], example: 'today' })
  @IsEnum(['today', 'week', 'month'])
  @IsOptional()
  date?: string;
}

export class TodayTransactionStatsResponse {
  @ApiProperty()
  total: number;
  @ApiProperty()
  inbound: number;
  @ApiProperty()
  outbound: number;
  @ApiProperty()
  adjustment: number;
}
