import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { QualityGrade } from '@prisma/client';

export class ReceiveHarvestDto {
  @ApiProperty({ description: 'ID of the daily report from field' })
  @IsString()
  @IsNotEmpty()
  dailyReportId: string;

  @ApiProperty({ description: 'ID of the contract associated with this harvest' })
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty({ description: 'ID of the destination warehouse' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ description: 'Actual weight weighed at warehouse' })
  @IsNumber()
  @Min(0)
  actualWeight: number;

  @ApiProperty({ enum: QualityGrade, description: 'Quality grade of the received goods' })
  @IsEnum(QualityGrade)
  qualityGrade: QualityGrade;

  @ApiProperty({ description: 'Justification for discrepancy > 5%', required: false })
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
