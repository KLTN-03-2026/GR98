import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, TransactionAction } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID của kho hàng' })
  @IsString({ message: 'ID kho không hợp lệ' })
  warehouseId: string;

  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsString({ message: 'ID sản phẩm không hợp lệ' })
  productId: string;

  @ApiProperty({ description: 'ID của lô hàng' })
  @IsString({ message: 'ID lô hàng không hợp lệ' })
  inventoryLotId: string;

  @IsEnum(TransactionType, { message: 'Loại giao dịch không hợp lệ' })
  type: TransactionType;

  @ApiProperty({
    description: 'Hành động chi tiết',
    enum: TransactionAction,
  })
  @IsEnum(TransactionAction, { message: 'Hành động không hợp lệ' })
  @IsOptional()
  action?: TransactionAction;

  @ApiProperty({ description: 'Số lượng (kg)' })
  @IsNumber({}, { message: 'Số lượng phải là một số' })
  @Min(0.01, { message: 'Số lượng phải lớn hơn 0' })
  quantityKg: number;

  @ApiProperty({ description: 'Ghi chú lý do giao dịch', required: false })
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  note?: string;

  @ApiProperty({ description: 'ID của kho nhận (dành cho điều chuyển)', required: false })
  @IsString({ message: 'ID kho nhận không hợp lệ' })
  @IsOptional()
  targetWarehouseId?: string;

  @ApiProperty({ description: 'Đánh dấu đây là giao dịch điều chuyển', required: false })
  @IsOptional()
  isTransfer?: boolean;
}
