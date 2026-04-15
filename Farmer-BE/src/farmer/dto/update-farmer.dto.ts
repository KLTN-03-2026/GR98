import { FarmerStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateFarmerDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+84|0)[0-9]{9,10}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'CCCD phải gồm đúng 12 chữ số',
  })
  cccd?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  supervisorId?: string | null;

  @IsOptional()
  @IsEnum(FarmerStatus, { message: 'Trạng thái không hợp lệ' })
  status?: FarmerStatus;
}
