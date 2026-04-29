import { IsDateString, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryPlantScanDto extends PaginationDto {
  /** Lọc theo mức độ nguy hiểm */
  @IsOptional()
  @IsString()
  dangerLevel?: string;

  /** Lọc theo loại bệnh: fungal / bacterial / viral / algal / healthy */
  @IsOptional()
  @IsString()
  category?: string;

  /** Lọc theo lô đất */
  @IsOptional()
  @IsString()
  plotId?: string;

  /** Admin: lọc theo supervisor cụ thể */
  @IsOptional()
  @IsString()
  supervisorId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  // Override limit max lên 50 cho trang này
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 15;
}
