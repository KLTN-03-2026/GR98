import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { QualityGrade, ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Sầu riêng Ri6', description: 'Tên sản phẩm' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'sau-rieng-ri6', description: 'Slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'PROD-001', description: 'Mã SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Mô tả sản phẩm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Sầu riêng', description: 'Loại nông sản' })
  @IsString()
  @IsNotEmpty()
  cropType: string;

  @ApiProperty({ enum: QualityGrade, example: QualityGrade.A })
  @IsEnum(QualityGrade)
  grade: QualityGrade;

  @ApiProperty({ example: 120000, description: 'Giá bán / kg' })
  @IsNumber()
  @Min(0)
  pricePerKg: number;

  @ApiPropertyOptional({ example: 100, description: 'Số tồn kho ban đầu' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockKg?: number;

  @ApiPropertyOptional({ example: 1, description: 'Mua tối thiểu (kg)' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  minOrderKg?: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'ID của hợp đồng (nếu có)' })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({ description: 'ID của lô đất (nếu có)' })
  @IsOptional()
  @IsString()
  plotId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách ID danh mục' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsEnum(QualityGrade)
  grade?: QualityGrade;

  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class CreateProductFromLotDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID của lô hàng gốc' })
  inventoryLotId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Tên thương mại của sản phẩm' })
  name: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Giá bán niêm yết' })
  pricePerKg: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  categoryIds?: string[];
}
