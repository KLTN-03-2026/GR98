import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class ReorderCategoryItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @Min(0)
  sortOrder: number;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Trái cây nhiệt đới', description: 'Tên danh mục' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'trai-cay-nhiet-doi',
    description: 'Slug (auto-generate nếu không truyền)',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'URL ảnh danh mục',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'Các loại trái cây nhiệt đới',
    description: 'Mô tả',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'Thứ tự hiển thị' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    value !== undefined ? parseInt(String(value), 10) : 0,
  )
  sortOrder?: number;

  @ApiPropertyOptional({ default: true, description: 'Trạng thái hoạt động' })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryQueryDto {
  @ApiPropertyOptional({ example: '1', description: 'Trang' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '50', description: 'Số bản ghi / trang' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ example: 'trai', description: 'Tìm kiếm theo tên' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ReorderCategoryDto {
  @ApiProperty({
    type: [ReorderCategoryItemDto],
    example: [
      { id: 'xxx', sortOrder: 0 },
      { id: 'yyy', sortOrder: 1 },
    ],
    description: 'Danh sách id và sortOrder mới',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderCategoryItemDto)
  orders: ReorderCategoryItemDto[];
}
