import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { IsBase64Image } from '../../common/validators/is-base64-image';

export class CreateInventoryStaffDto {
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Email là bắt buộc' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/^[A-Z]/, {
    message: 'Ký tự đầu tiên phải là chữ cái in hoa',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt',
  })
  password: string;

  @IsOptional()
  @IsBase64Image({
    message:
      'Ảnh đại diện phải có dung lượng nhỏ hơn 5MB và định dạng hợp lệ (PNG, JPG, WEBP, ...)',
  })
  avatar?: string;
}
