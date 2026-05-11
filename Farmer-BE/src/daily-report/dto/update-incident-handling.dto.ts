import { IncidentHandlingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Admin cập nhật trạng thái xử lý sự cố cho một báo cáo loại INCIDENT.
 */
export class UpdateIncidentHandlingDto {
  @IsEnum(IncidentHandlingStatus)
  status!: IncidentHandlingStatus;

  /** Ghi chú: tên chuyên gia được cử, kết quả xử lý, lý do... */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
