import { apiClient, extractData } from '@/client/lib/api-client';

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a single image file to Cloudinary via backend.
 * @param file - File object to upload
 * @param folder - Cloudinary folder (avatars, products, reports, etc.)
 */
export async function uploadImage(
  file: File,
  folder = 'general',
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post(
    `/upload/image?folder=${encodeURIComponent(folder)}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return extractData<UploadResult>(res);
}

/**
 * Upload multiple image files to Cloudinary via backend.
 * @param files - Array of File objects
 * @param folder - Cloudinary folder
 */
export async function uploadImages(
  files: File[],
  folder = 'general',
): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const res = await apiClient.post(
    `/upload/images?folder=${encodeURIComponent(folder)}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return extractData<UploadResult[]>(res);
}
