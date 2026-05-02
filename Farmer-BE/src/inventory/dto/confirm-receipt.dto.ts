import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConfirmReceiptDto {
  @ApiProperty({ description: 'Khối lượng thực nhập (kg)', example: 450.5 })
  @IsNumber()
  @Min(0)
  actualWeight: number;

  @ApiProperty({ description: 'Ghi chú giải trình (nếu có)', example: 'Hàng thực tế đủ' })
  @IsOptional()
  @IsString()
  note?: string;
}
