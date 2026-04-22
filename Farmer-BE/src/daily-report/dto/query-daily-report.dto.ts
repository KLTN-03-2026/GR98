import { ReportStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryDailyReportDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  /** Admin: lọc theo giám sát viên */
  @IsOptional()
  @IsString()
  supervisorId?: string;

  @IsOptional()
  @IsString()
  plotId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
