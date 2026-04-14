import { UserStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsBase64Image } from '../../common/validators/is-base64-image';

export class UpdateInventoryStaffDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;

  @IsOptional()
  @IsBase64Image({
    message:
      'Ảnh đại diện phải có dung lượng nhỏ hơn 5MB và định dạng hợp lệ (PNG, JPG, WEBP, ...)',
  })
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  clearAvatar?: boolean;
}
