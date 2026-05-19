import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateScanSessionDto {
  @ApiProperty({ description: 'ID lô đất supervisor đang quét' })
  @IsString()
  @IsNotEmpty()
  plotId!: string;

  @ApiProperty({ required: false, description: 'Ghi chú đầu phiên' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CloseScanSessionDto {
  @ApiProperty({ required: false, description: 'Ghi chú khi đóng phiên' })
  @IsOptional()
  @IsString()
  note?: string;
}
