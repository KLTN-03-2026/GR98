import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectLotDto {
  @ApiProperty({
    description: 'Lý do từ chối lô hàng',
    example: 'Hàng bị hư hỏng trong quá trình vận chuyển',
  })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do từ chối' })
  @IsString()
  @MinLength(5, { message: 'Lý do từ chối phải có ít nhất 5 ký tự' })
  reason: string;
}
