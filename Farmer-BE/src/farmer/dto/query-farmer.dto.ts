import { FarmerStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryFarmerDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 15;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(FarmerStatus, { message: 'Trạng thái không hợp lệ' })
  status?: FarmerStatus;

  @IsOptional()
  @IsString()
  supervisorId?: string;

  @IsOptional()
  @IsString()
  province?: string;

  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 15);
  }

  get take(): number {
    return this.limit || 15;
  }
}
