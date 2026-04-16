import { FarmerStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateFarmerDto {
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Số điện thoại là bắt buộc' })
  @IsString()
  @Matches(/^(\+84|0)[0-9]{9,10}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @IsNotEmpty({ message: 'CCCD là bắt buộc' })
  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'CCCD phải gồm đúng 12 chữ số',
  })
  cccd: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankBranch?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  supervisorId?: string;

  @IsOptional()
  @IsEnum(FarmerStatus, { message: 'Trạng thái không hợp lệ' })
  status?: FarmerStatus;
}
