import { QualityGrade } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateContractDto {
  @IsOptional()
  @IsString()
  farmerId?: string;

  @IsNotEmpty({ message: 'Lô đất là bắt buộc' })
  @IsString()
  plotId: string;

  @IsOptional()
  @IsString()
  priceBoardId?: string;

  @IsNotEmpty({ message: 'Loại cây trồng là bắt buộc' })
  @IsString()
  cropType: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Sản lượng phải lớn hơn 0' })
  quantityKg: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Giá sàn phải lớn hơn 0' })
  pricePerKg: number;

  @IsEnum(QualityGrade, { message: 'Phân hạng chất lượng không hợp lệ' })
  grade: QualityGrade;

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
