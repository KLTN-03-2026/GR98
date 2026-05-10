import { Injectable, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cloudinary = require('cloudinary').v2;

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<UploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Không có file để upload');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File vượt quá 10MB');
    }

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `gr98/${folder}`,
          resource_type: 'image',
        },
        (error: any, result: any) => {
          if (error || !result)
            return reject(error || new Error('Upload thất bại'));
          resolve(result);
        },
      );
      stream.end(file.buffer);
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder = 'general',
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.uploadFile(f, folder)));
  }

  async uploadBase64(
    base64DataUrl: string,
    folder = 'general',
  ): Promise<UploadResult> {
    if (!base64DataUrl || !base64DataUrl.startsWith('data:')) {
      throw new BadRequestException('Dữ liệu base64 không hợp lệ');
    }

    const result: any = await cloudinary.uploader.upload(base64DataUrl, {
      folder: `gr98/${folder}`,
      resource_type: 'image',
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
