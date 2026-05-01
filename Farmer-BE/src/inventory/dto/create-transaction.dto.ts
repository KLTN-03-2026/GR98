import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  ADJUSTMENT = 'adjustment',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID của kho hàng' })
  @IsString()
  warehouseId: string;

  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'ID của lô hàng' })
  @IsString()
  inventoryLotId: string;

  @ApiProperty({
    description: 'Loại giao dịch',
    enum: TransactionType,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Số lượng (kg)' })
  @IsNumber()
  @Min(0.01, { message: 'Số lượng phải lớn hơn 0' })
  quantityKg: number;

  @ApiProperty({ description: 'Ghi chú lý do giao dịch', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ description: 'ID của lô hàng nguồn (cho điều chuyển)', required: false })
  @IsString()
  @IsOptional()
  sourceLotId?: string;
}
