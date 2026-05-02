import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { AdminOverviewRangePreset } from './admin-overview-query.dto';

export class DashboardOverviewQueryDto {
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
