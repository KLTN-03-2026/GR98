import { QualityGrade } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  farmerId?: string;

  @IsOptional()
  @IsString()
  plotId?: string;

  @IsOptional()
  @IsString()
  priceBoardId?: string;

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Sản lượng phải lớn hơn 0' })
  quantityKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Giá sàn phải lớn hơn 0' })
  pricePerKg?: number;

  @IsOptional()
  @IsEnum(QualityGrade, { message: 'Phân hạng chất lượng không hợp lệ' })
  grade?: QualityGrade;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày ký không hợp lệ' })
  signedAt?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc hợp đồng không hợp lệ' })
  harvestDue?: string;

  @IsOptional()
  @IsString()
  signatureUrl?: string;
}

export class RejectContractDto {
  @IsString()
  @IsOptional()
  rejectedReason?: string;
}
