import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlotDto {
  @ApiProperty({
    example: 'Lô Đồi Gió',
    description: 'Tên lô hiển thị trên UI',
  })
  @IsString()
  @IsNotEmpty()
  plotName!: string;

  @ApiPropertyOptional({
    example: 'farmer_cuid',
    description: 'ID nông dân (ưu tiên dùng field này nếu có)',
  })
  @IsOptional()
  @IsString()
  farmerId?: string;

  @ApiPropertyOptional({
    example: 'Nguyễn Văn A',
    description: 'Fallback tìm nông dân theo tên trong tenant',
  })
  @IsOptional()
  @IsString()
  farmerName?: string;

  @ApiPropertyOptional({
    example: '0901111222',
    description: 'Số điện thoại nông dân để đối chiếu trước khi tạo',
  })
  @IsOptional()
  @IsString()
  farmerPhone?: string;

  @ApiPropertyOptional({
    example: '001201001234',
    description: 'CCCD nông dân để đối chiếu trước khi tạo',
  })
  @IsOptional()
  @IsString()
  farmerCccd?: string;

  @ApiPropertyOptional({
    example: 'CT-2026-101',
    description: 'Mã hợp đồng hiển thị trên UI',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiProperty({
    example: 'ca-phe',
    description: 'ca-phe | sau-rieng | hoặc cropType text',
  })
  @IsString()
  @IsNotEmpty()
  cropType!: string;

  @ApiProperty({ example: 2.8, description: 'Diện tích (ha)' })
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => Number(value))
  areaHa!: number;

  @ApiPropertyOptional({ example: 20.84 })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : Number(value),
  )
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: 104.74 })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : Number(value),
  )
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ example: 'Sơn La' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 'Mộc Châu' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    example: 'cmabc123supervisor',
    description: 'ID Supervisor muốn phân công cho lô đất',
  })
  @IsOptional()
  @IsString()
  id_suppervisor?: string;

  @ApiPropertyOptional({
    example: 'Nguyễn Văn B',
    description: 'Tên Supervisor để đối chiếu nếu FE gửi kèm',
  })
  @IsOptional()
  @IsString()
  name_suppervisor?: string;

  @ApiPropertyOptional({
    example: [
      [20.8401, 104.7398],
      [20.8408, 104.7404],
      [20.8396, 104.7411],
    ],
    description: 'Polygon lưu dạng [lat, lng] để FE dùng lại khi cần',
  })
  @IsOptional()
  polygon?: Array<[number, number]>;
}

export class PlotQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: 'lô đồi' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'ca-phe' })
  @IsOptional()
  @IsString()
  cropType?: string;
}

export class UpdatePlotDto {
  @ApiPropertyOptional({
    example: 'cmabc123supervisor',
    description: 'ID Supervisor muốn phân công lại cho lô đất',
  })
  @IsOptional()
  @IsString()
  id_suppervisor?: string;

  @ApiPropertyOptional({
    example: 'Nguyễn Văn B',
    description: 'Tên Supervisor để đối chiếu nếu FE gửi kèm',
  })
  @IsOptional()
  @IsString()
  name_suppervisor?: string;
}
