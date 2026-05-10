import { Role, VehicleType } from '@prisma/client';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';

export class CreateUserDto {
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

  @IsNotEmpty({ message: 'Vai trò là bắt buộc' })
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role: Role;

  @IsOptional()
  @IsString()
  avatar?: string; // Cloudinary URL

  // ── ADMIN-only fields ──────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  // ── CLIENT-only fields ─────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  defaultAddress?: string;

  // ── SHIPPER-only fields ────────────────────────────────────────────────────
  @IsOptional()
  @IsEnum(VehicleType, { message: 'Loại phương tiện không hợp lệ' })
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  licensePlate?: string;
}
