import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
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
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '15' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ enum: QualityGrade })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(QualityGrade)
  grade?: QualityGrade;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'newest' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  minPrice?: string;

  @ApiPropertyOptional({ example: '1000000' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  maxPrice?: string;
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
  @IsString()
  @ApiPropertyOptional({ description: 'Slug tùy chỉnh' })
  slug?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SKU tùy chỉnh' })
  sku?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  categoryIds?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  status?: ProductStatus;
}

export class CreateProductFromContractDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID của hợp đồng (phải ở trạng thái ACTIVE hoặc SETTLED)' })
  contractId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Tên thương mại của sản phẩm' })
  name: string;

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
  @IsString()
  @ApiPropertyOptional({ description: 'Slug tùy chỉnh' })
  slug?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SKU tùy chỉnh' })
  sku?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  categoryIds?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  thumbnailUrl?: string;
}
