import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { QualityGrade } from '@prisma/client';

export class CreateInventoryLotDto {
  @ApiProperty({ example: 'cm2abc123' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: 'cm2xyz789' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'contract-123' })
  @IsString()
  @IsOptional()
  contractId?: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  quantityKg: number;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsString()
  @IsOptional()
  harvestDate?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({ enum: QualityGrade, example: 'A' })
  @IsEnum(QualityGrade)
  qualityGrade: QualityGrade;

  @ApiPropertyOptional({ example: 'Nhập kho từ vụ thu hoạch tháng 4' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class InventoryLotQueryDto {
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

  @ApiPropertyOptional({ enum: QualityGrade })
  @IsEnum(QualityGrade)
  @IsOptional()
  qualityGrade?: QualityGrade;

  @ApiPropertyOptional({ example: 'low-stock' })
  @IsString()
  @IsOptional()
  alert?: string;
}
