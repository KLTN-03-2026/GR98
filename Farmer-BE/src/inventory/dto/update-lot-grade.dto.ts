import { ApiProperty } from '@nestjs/swagger';
import { QualityGrade } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateLotGradeDto {
  @ApiProperty({ enum: QualityGrade, description: 'Phẩm cấp mới của lô hàng' })
  @IsEnum(QualityGrade)
  @IsNotEmpty()
  qualityGrade: QualityGrade;

  @ApiProperty({ description: 'Lý do thay đổi phẩm cấp' })
  @IsString()
  @IsNotEmpty()
  note: string;
}
