import { ApiPropertyOptional } from '@nestjs/swagger';
import { QualityGrade } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryLotDto {
  @ApiPropertyOptional({ enum: QualityGrade })
  @IsOptional()
  @IsEnum(QualityGrade)
  qualityGrade?: QualityGrade;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
