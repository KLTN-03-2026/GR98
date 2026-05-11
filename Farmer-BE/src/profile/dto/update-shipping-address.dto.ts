import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { AddressType } from './create-shipping-address.dto';

export class UpdateShippingAddressDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsIn(['HOME', 'OFFICE'], { message: 'Loại địa chỉ không hợp lệ' })
  addressType?: AddressType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
