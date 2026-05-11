import { IncidentHandlingStatus, ReportStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryDailyReportDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  /** Lọc theo trạng thái xử lý sự cố (chỉ có nghĩa với type=INCIDENT). */
  @IsOptional()
  @IsEnum(IncidentHandlingStatus)
  incidentHandlingStatus?: IncidentHandlingStatus;

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

  @IsOptional()
  @IsString()
  isHarvest?: string; // "true" or "false"

  @IsOptional()
  @IsString()
  type?: string;
}
