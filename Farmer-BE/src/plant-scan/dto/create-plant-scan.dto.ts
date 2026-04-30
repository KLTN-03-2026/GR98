import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePlantScanDto {
  @IsString()
  diseaseEn!: string;

  @IsString()
  diseaseVi!: string;

  @IsString()
  causingAgent!: string;

  @IsString()
  dangerLevel!: string;

  @IsString()
  category!: string;

  @IsString()
  symptoms!: string;

  @IsString()
  treatment!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsOptional()
  @IsNumber()
  processingMs?: number;

  /** ID lô đất (nếu supervisor chọn trước khi quét) */
  @IsOptional()
  @IsString()
  plotId?: string;

  /** Ảnh base64 — tùy chọn, có thể không lưu để tiết kiệm DB */
  @IsOptional()
  @IsString()
  imageDataUrl?: string;
}
