import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

/**
 * Query cho bản đồ nhiệt cảnh báo dịch bệnh.
 * Mặc định: 7 ngày gần nhất, tất cả cây + category.
 */
export class DiseaseHeatmapQueryDto {
  @ApiPropertyOptional({ description: 'Từ ngày (ISO date)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (ISO date)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: "Loại cây: 'ca-phe' | 'sau-rieng'" })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo loại bệnh (fungal | bacterial | pest | algal...)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description:
      'Chỉ trả về plot có severity >= mức này (none | light | medium | severe)',
    enum: ['none', 'light', 'medium', 'severe'],
  })
  @IsOptional()
  @IsIn(['none', 'light', 'medium', 'severe'])
  minSeverity?: 'none' | 'light' | 'medium' | 'severe';

  @ApiPropertyOptional({
    description: 'Số ngày lùi lại nếu không truyền from/to (default 7)',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  windowDays?: number;
}
