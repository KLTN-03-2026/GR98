import { Role, UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @ValidateIf(
    (_obj, value) => value !== undefined && value !== null && value !== '',
  )
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/^[A-Z]/, {
    message: 'Ký tự đầu tiên phải là chữ cái in hoa',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt',
  })
  password?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;

  @IsOptional()
  @IsString()
  avatar?: string; // Base64 data URL

  @IsOptional()
  @IsBoolean()
  clearAvatar?: boolean; // true → xóa avatar

  // ── ADMIN-only fields ──────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  // ── CLIENT-only fields ─────────────────────────────────────────────────────
}
