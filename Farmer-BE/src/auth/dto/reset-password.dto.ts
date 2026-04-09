import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123token', description: 'Token đặt lại mật khẩu' })
  @IsNotEmpty({ message: 'Token là bắt buộc' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'Password123!', description: 'Mật khẩu mới' })
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
