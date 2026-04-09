import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Mật khẩu hiện tại là bắt buộc' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: 'Mật khẩu mới là bắt buộc' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/^[A-Z]/, {
    message: 'Ký tự đầu tiên phải là chữ cái in hoa',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt',
  })
  newPassword: string;
}
