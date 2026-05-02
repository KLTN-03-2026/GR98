import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum AdminOverviewRangePreset {
  LAST_7_DAYS = '7d',
  LAST_14_DAYS = '14d',
  LAST_30_DAYS = '30d',
  MONTH_TO_DATE = 'mtd',
}

export class AdminOverviewQueryDto {
  @IsOptional()
  @IsEnum(AdminOverviewRangePreset)
  rangePreset?: AdminOverviewRangePreset;

  @IsOptional()
  @IsDateString()
  @Type(() => String)
  from?: string;

  @IsOptional()
  @IsDateString()
  @Type(() => String)
  to?: string;
}
