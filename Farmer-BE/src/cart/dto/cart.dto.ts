import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 'clxxx123', description: 'ID sản phẩm' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Số lượng (kg)' })
  @IsNumber()
  @IsPositive()
  @Min(0.25)
  quantityKg: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @IsNumber()
  @IsPositive()
  @Min(0.25)
  quantityKg: number;
}
