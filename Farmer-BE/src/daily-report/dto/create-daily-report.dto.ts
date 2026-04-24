import { ReportType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, ArrayMaxSize } from 'class-validator';

export class CreateDailyReportDto {
  @IsString()
  plotId!: string;

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
}
