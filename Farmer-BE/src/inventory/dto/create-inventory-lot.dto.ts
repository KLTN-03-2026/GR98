import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QualityGrade } from '@prisma/client';

export class CreateInventoryLotDto {
  @ApiProperty({ description: 'ID của kho hàng' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'ID của hợp đồng (nguồn gốc)', required: false })
  @IsString()
  @IsOptional()
  contractId?: string;

  @ApiProperty({ description: 'Số lượng ban đầu (kg)' })
  @IsNumber()
  @Min(0.01)
  quantityKg: number;

  @ApiProperty({ description: 'Ngày thu hoạch', required: false })
  @IsDateString()
  @IsOptional()
  harvestDate?: string;

  @ApiProperty({ description: 'Ngày hết hạn', required: false })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({ description: 'Chất lượng (GRADE_A, GRADE_B, ...)', enum: QualityGrade })
  @IsString()
  @IsNotEmpty()
  qualityGrade: QualityGrade;

  @ApiProperty({ description: 'Ghi chú', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ description: 'Lý do giải trình sai lệch sản lượng', required: false })
  @IsString()
  @IsOptional()
  deviationReason?: string;

  @ApiProperty({ description: 'ID của báo cáo thu hoạch (để cập nhật trạng thái)', required: false })
  @IsString()
  @IsOptional()
  reportId?: string;
}
