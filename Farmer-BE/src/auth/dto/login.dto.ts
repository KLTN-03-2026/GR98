import { IsString, IsNotEmpty, ValidateIf } from 'class-validator';

export class LoginDto {
  @ValidateIf((o) => !o.phone)
  @IsNotEmpty({ message: 'Email là bắt buộc khi không có số điện thoại' })
  @IsString()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Số điện thoại là bắt buộc khi không có email' })
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  @IsString()
  password: string;
}
