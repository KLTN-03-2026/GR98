import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { uploadImage, type UploadResult } from '@/client/api/upload';

export type ImageUploadStatus = 'uploading' | 'done' | 'error';

export interface ImageUploadItem {
  id: string;
  previewUrl: string;
  url: string | null;
  status: ImageUploadStatus;
  error?: string;
  fileName?: string;
}

interface UseImageUploaderOptions {
  folder: string;
  maxImages?: number;
  maxFileBytes?: number;
  onChange?: (urls: string[]) => void;
}

interface UseImageUploaderResult {
  items: ImageUploadItem[];
  urls: string[];
  isUploading: boolean;
  addFiles: (files: FileList | File[] | null | undefined) => Promise<void>;
  remove: (id: string) => void;
  retry: (id: string) => Promise<void>;
  setFromUrls: (urls: string[]) => void;
  clear: () => void;
}

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

function isBlobUrl(url: string) {
  return url.startsWith('blob:');
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useImageUploader(
  options: UseImageUploaderOptions,
): UseImageUploaderResult {
  const { folder, maxImages = 10, maxFileBytes = DEFAULT_MAX_BYTES } = options;

  const [items, setItems] = useState<ImageUploadItem[]>([]);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    return () => {
      setItems((prev) => {
        prev.forEach((it) => {
          if (isBlobUrl(it.previewUrl)) URL.revokeObjectURL(it.previewUrl);
        });
        return prev;
      });
    };
  }, []);

  const validate = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith('image/')) return 'Chỉ chấp nhận file ảnh';
      if (file.size > maxFileBytes) {
        const mb = Math.round(maxFileBytes / (1024 * 1024));
        return `Ảnh "${file.name}" vượt quá ${mb}MB`;
      }
      return null;
    },
    [maxFileBytes],
  );

  const uploadOne = useCallback(
    async (id: string, file: File) => {
      try {
        const uploaded: UploadResult = await uploadImage(file, folder);
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            if (isBlobUrl(it.previewUrl)) URL.revokeObjectURL(it.previewUrl);
            return {
              ...it,
              previewUrl: uploaded.url,
              url: uploaded.url,
              status: 'done',
              error: undefined,
            };
          }),
        );
        fileMapRef.current.delete(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tải ảnh thất bại';
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, status: 'error', error: msg } : it,
          ),
        );
        toast.error(`Không thể tải lên "${file.name}": ${msg}`);
      }
    },
    [folder],
  );

  const addFiles = useCallback(
    async (incoming: FileList | File[] | null | undefined) => {
      if (!incoming) return;
      const arr = Array.from(incoming);
      const newOnes: ImageUploadItem[] = [];

      setItems((prev) => {
        const slotsLeft = Math.max(0, maxImages - prev.length);
        const accepted = arr.slice(0, slotsLeft);
        if (arr.length > slotsLeft) {
          toast.message(`Tối đa ${maxImages} ảnh`);
        }
        for (const file of accepted) {
          const err = validate(file);
          if (err) {
            toast.error(err);
            continue;
          }
          const id = makeId();
          const previewUrl = URL.createObjectURL(file);
          fileMapRef.current.set(id, file);
          newOnes.push({
            id,
            previewUrl,
            url: null,
            status: 'uploading',
            fileName: file.name,
          });
        }
        return [...prev, ...newOnes];
      });

      await Promise.all(
        newOnes.map((it) => uploadOne(it.id, fileMapRef.current.get(it.id)!)),
      );
    },
    [maxImages, uploadOne, validate],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) =>
      prev.filter((it) => {
        if (it.id !== id) return true;
        if (isBlobUrl(it.previewUrl)) URL.revokeObjectURL(it.previewUrl);
        fileMapRef.current.delete(id);
        return false;
      }),
    );
  }, []);

  const retry = useCallback(
    async (id: string) => {
      const file = fileMapRef.current.get(id);
      if (!file) return;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: 'uploading', error: undefined } : it,
        ),
      );
      await uploadOne(id, file);
    },
    [uploadOne],
  );

  const setFromUrls = useCallback((urls: string[]) => {
    setItems((prev) => {
      prev.forEach((it) => {
        if (isBlobUrl(it.previewUrl)) URL.revokeObjectURL(it.previewUrl);
      });
      fileMapRef.current.clear();
      return urls.map((url, idx) => ({
        id: `existing-${idx}-${makeId()}`,
        previewUrl: url,
        url,
        status: 'done' as const,
      }));
    });
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => {
        if (isBlobUrl(it.previewUrl)) URL.revokeObjectURL(it.previewUrl);
      });
      return [];
    });
    fileMapRef.current.clear();
  }, []);

  const urls = useMemo(
    () =>
      items
        .filter((it) => it.status === 'done' && it.url)
        .map((it) => it.url as string),
    [items],
  );
  const isUploading = useMemo(
    () => items.some((it) => it.status === 'uploading'),
    [items],
  );

  return {
    items,
    urls,
    isUploading,
    addFiles,
    remove,
    retry,
    setFromUrls,
    clear,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Biến thể: useSingleImageUploader — dùng cho các chỗ chỉ có 1 ảnh
// (avatar, signature, thumbnail, delivery proof, category image).
// ────────────────────────────────────────────────────────────────────────────

interface UseSingleImageUploaderOptions {
  folder: string;
  maxFileBytes?: number;
  onChange?: (url: string | null) => void;
}

export interface UseSingleImageUploaderResult {
  item: ImageUploadItem | null;
  url: string | null;
  isUploading: boolean;
  upload: (file: File | null | undefined) => Promise<void>;
  retry: () => Promise<void>;
  clear: () => void;
  setFromUrl: (url: string | null) => void;
}

export function useSingleImageUploader(
  options: UseSingleImageUploaderOptions,
): UseSingleImageUploaderResult {
  const { folder, maxFileBytes = DEFAULT_MAX_BYTES, onChange } = options;
  const [item, setItem] = useState<ImageUploadItem | null>(null);
  const fileRef = useRef<File | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return () => {
      setItem((prev) => {
        if (prev && isBlobUrl(prev.previewUrl)) URL.revokeObjectURL(prev.previewUrl);
        return prev;
      });
    };
  }, []);

  const doUpload = useCallback(
    async (id: string, file: File) => {
      try {
        const uploaded = await uploadImage(file, folder);
        setItem((prev) => {
          if (!prev || prev.id !== id) return prev;
          if (isBlobUrl(prev.previewUrl)) URL.revokeObjectURL(prev.previewUrl);
          return {
            ...prev,
            previewUrl: uploaded.url,
            url: uploaded.url,
            status: 'done',
            error: undefined,
          };
        });
        onChangeRef.current?.(uploaded.url);
        fileRef.current = null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tải ảnh thất bại';
        setItem((prev) =>
          prev && prev.id === id ? { ...prev, status: 'error', error: msg } : prev,
        );
        toast.error(`Không thể tải lên "${file.name}": ${msg}`);
      }
    },
    [folder],
  );

  const upload = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Chỉ chấp nhận file ảnh');
        return;
      }
      if (file.size > maxFileBytes) {
        const mb = Math.round(maxFileBytes / (1024 * 1024));
        toast.error(`Ảnh "${file.name}" vượt quá ${mb}MB`);
        return;
      }
      const id = makeId();
      const previewUrl = URL.createObjectURL(file);
      fileRef.current = file;
      setItem((prev) => {
        if (prev && isBlobUrl(prev.previewUrl)) URL.revokeObjectURL(prev.previewUrl);
        return {
          id,
          previewUrl,
          url: null,
          status: 'uploading',
          fileName: file.name,
        };
      });
      await doUpload(id, file);
    },
    [doUpload, maxFileBytes],
  );

  const retry = useCallback(async () => {
    const file = fileRef.current;
    const current = item;
    if (!file || !current) return;
    setItem({ ...current, status: 'uploading', error: undefined });
    await doUpload(current.id, file);
  }, [doUpload, item]);

  const clear = useCallback(() => {
    setItem((prev) => {
      if (prev && isBlobUrl(prev.previewUrl)) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    fileRef.current = null;
    onChangeRef.current?.(null);
  }, []);

  const setFromUrl = useCallback((url: string | null) => {
    setItem((prev) => {
      if (prev && isBlobUrl(prev.previewUrl)) URL.revokeObjectURL(prev.previewUrl);
      if (!url) return null;
      return {
        id: `existing-${makeId()}`,
        previewUrl: url,
        url,
        status: 'done',
      };
    });
    fileRef.current = null;
  }, []);

  return {
    item,
    url: item?.status === 'done' ? item.url : null,
    isUploading: item?.status === 'uploading',
    upload,
    retry,
    clear,
    setFromUrl,
  };
}
