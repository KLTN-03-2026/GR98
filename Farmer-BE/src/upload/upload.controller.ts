import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { CloudinaryService } from './cloudinary.service';
import { memoryStorage } from 'multer';

const storage = memoryStorage();

@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(AuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload 1 ảnh lên Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Thư mục lưu trữ (avatars, products, reports, ...)',
    example: 'products',
  })
  @ApiResponse({ status: 200, description: 'Upload thành công' })
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('Chưa chọn file');
    const result = await this.cloudinaryService.uploadFile(file, folder || 'general');
    return result;
  }

  @Post('images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload nhiều ảnh lên Cloudinary (tối đa 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['files'],
    },
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Thư mục lưu trữ',
    example: 'products',
  })
  @ApiResponse({ status: 200, description: 'Upload thành công' })
  @UseInterceptors(FilesInterceptor('files', 10, { storage, limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('Chưa chọn file');
    const results = await this.cloudinaryService.uploadFiles(files, folder || 'general');
    return results;
  }
}
