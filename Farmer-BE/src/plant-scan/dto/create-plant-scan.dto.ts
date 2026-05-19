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

  /**
   * ID phiên quét (ScanSession) — nếu supervisor đang mở phiên đa điểm.
   * Khi truyền vào, BE sẽ gắn scan này vào phiên để cuối phiên tổng hợp.
   */
  @IsOptional()
  @IsString()
  sessionId?: string;

  /** Ảnh base64 — tùy chọn, có thể không lưu để tiết kiệm DB */
  @IsOptional()
  @IsString()
  imageDataUrl?: string;
}
