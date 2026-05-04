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

export class CreateDailyReportDto {
  @IsString()
  plotId!: string;

  @IsOptional()
  @IsEnum(['ROUTINE', 'INCIDENT', 'HARVEST'], {
    message: 'type must be one of: ROUTINE, INCIDENT, HARVEST',
  })
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
