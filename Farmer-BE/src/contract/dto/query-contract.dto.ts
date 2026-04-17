import { ContractStatus, QualityGrade } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryContractDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 12;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ContractStatus, { message: 'Trạng thái hợp đồng không hợp lệ' })
  status?: ContractStatus;

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsEnum(QualityGrade, { message: 'Phân hạng chất lượng không hợp lệ' })
  grade?: QualityGrade;

  @IsOptional()
  @IsString()
  farmerId?: string;

  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 12);
  }

  get take(): number {
    return this.limit || 12;
  }
}
