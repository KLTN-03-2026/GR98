import { QualityGrade } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
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
  plotDraftProvince?: string;

  @IsOptional()
  @IsString()
  plotDraftDistrict?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Diện tích chuẩn phải lớn hơn 0' })
  plotDraftAreaHa?: number;

  @IsOptional()
  @IsString()
  plotDraftCoordinatesText?: string;


  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsOptional()
  @IsEnum(QualityGrade, { message: 'Phân khúc cây trồng không hợp lệ' })
  @IsIn(
    [QualityGrade.PREMIUM, QualityGrade.STANDARD, QualityGrade.ECONOMY],
    {
      message: 'Phân khúc hợp đồng phải là Cao cấp / Tiêu chuẩn / Phổ thông',
    },
  )
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
  rejectedReason: string;
}
