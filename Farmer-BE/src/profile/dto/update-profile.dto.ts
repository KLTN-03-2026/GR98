import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { IsBase64Image } from '../../common/validators/is-base64-image';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsBase64Image({
    message:
      'Ảnh đại diện phải có dung lượng nhỏ hơn 5MB và định dạng hợp lệ (PNG, JPG, WEBP)',
  })
  avatar?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsBoolean()
  clearAvatar?: boolean;
}
