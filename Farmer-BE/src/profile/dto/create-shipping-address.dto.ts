import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateShippingAddressDto {
  @IsNotEmpty({ message: 'Họ tên người nhận là bắt buộc' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Số điện thoại là bắt buộc' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Địa chỉ là bắt buộc' })
  @IsString()
  addressLine: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsNotEmpty({ message: 'Tỉnh/Thành phố là bắt buộc' })
  @IsString()
  province: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
