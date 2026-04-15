import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { QualityGrade } from '@prisma/client';

export class CreatePriceBoardDto {
  @ApiProperty({ example: 'Thanh long', description: 'Loại nông sản' })
  @IsString()
  @IsNotEmpty()
  cropType: string;

  @ApiProperty({ enum: QualityGrade, example: QualityGrade.A })
  @IsEnum(QualityGrade)
  grade: QualityGrade;

  @ApiProperty({ example: 15000, description: 'Giá mua vào (VNĐ/kg)' })
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  buyPrice: number;

  @ApiProperty({ example: 25000, description: 'Giá bán ra (VNĐ/kg)' })
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  sellPrice: number;

  @ApiPropertyOptional({
    example: '2026-04-15',
    description: 'Ngày có hiệu lực (mặc định: hôm nay)',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

export class UpdatePriceBoardDto extends PartialType(CreatePriceBoardDto) {}

export class PriceBoardQueryDto {
  @ApiPropertyOptional({
    example: 'Thanh long',
    description: 'Lọc theo loại nông sản',
  })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ enum: QualityGrade, example: QualityGrade.A })
  @IsOptional()
  @IsEnum(QualityGrade)
  grade?: QualityGrade;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Chỉ hiển thị bảng giá đang active',
  })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ example: '1', description: 'Trang' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20', description: 'Số bản ghi / trang' })
  @IsOptional()
  @IsString()
  limit?: string;
}
