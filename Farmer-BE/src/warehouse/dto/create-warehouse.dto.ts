import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Kho Bình Thạnh' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Trãi, Bình Thạnh, TP.HCM' })
  @IsString()
  @IsOptional()
  locationAddress?: string;

  @ApiPropertyOptional({ example: 'cm2abc123' })
  @IsString()
  @IsOptional()
  managedBy?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class WarehouseQueryDto {
  @ApiPropertyOptional({ default: '1' })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: '20' })
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({ example: 'cm2abc123' })
  @IsString()
  @IsOptional()
  managedBy?: string;
}
