import { QualityGrade } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
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

  @IsOptional()
  @IsString()
  plotId?: string;

  // Draft thông tin lô đất (dùng khi chưa có plotId)
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


  @IsNotEmpty({ message: 'Loại cây trồng là bắt buộc' })
  @IsString()
  cropType: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsEnum(QualityGrade, { message: 'Phân khúc cây trồng không hợp lệ' })
  @IsIn([QualityGrade.STANDARD, QualityGrade.PREMIUM], {
    message: 'Hợp đồng chỉ được chọn phân khúc Tiêu chuẩn hoặc Cao cấp',
  })
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
