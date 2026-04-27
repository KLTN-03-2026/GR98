import { ReportType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateDailyReportDto {
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  imageUrls?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : Number(value),
  )
  yieldEstimateKg?: number;
}
