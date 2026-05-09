import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Kho trung tâm' })
  @IsNotEmpty({ message: 'Tên kho là bắt buộc' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  locationAddress?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'ID hồ sơ nhân viên kho (InventoryProfile); bỏ qua hoặc null = chưa gán',
  })
  @IsOptional()
  @IsString()
  managedBy?: string | null;

  @ApiPropertyOptional({ description: 'Sức chứa tối đa của kho (kg). Bỏ trống nghĩa là không giới hạn.' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacityKg?: number | null;
}
