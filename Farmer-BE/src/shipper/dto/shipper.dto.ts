import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ShipperStatus, VehicleType } from '@prisma/client';

export class CreateShipperDto {
  @ApiProperty({ example: 'shipper1@farmers.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn Shipper' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: '29-A1 123.45' })
  @IsOptional()
  @IsString()
  licensePlate?: string;
}

export class UpdateShipperDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({ enum: ShipperStatus })
  @IsOptional()
  @IsEnum(ShipperStatus)
  status?: ShipperStatus;
}

export class UpdateLocationDto {
  @ApiProperty({ example: 10.7769 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 106.7009 })
  @IsNumber()
  lng: number;
}

export class QueryShipperDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ShipperStatus })
  @IsOptional()
  @IsEnum(ShipperStatus)
  status?: ShipperStatus;
}
