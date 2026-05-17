import { AlertTriangle, Loader2, RotateCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ImageUploadItem } from '@/client/hooks/use-image-uploader';

interface ImageUploadTileProps {
  item: ImageUploadItem;
  onRemove: () => void;
  onRetry?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function ImageUploadTile({
  item,
  onRemove,
  onRetry,
  readOnly,
  className,
}: ImageUploadTileProps) {
  const uploading = item.status === 'uploading';
  const errored = item.status === 'error';

  return (
    <div
      className={
        'relative group aspect-video rounded-md border overflow-hidden bg-muted ' +
        (className ?? '')
      }
    >
      <img
        src={item.previewUrl}
        alt={item.fileName ?? ''}
        className={`h-full w-full object-cover transition-opacity ${
          uploading || errored ? 'opacity-50' : ''
        }`}
      />

      {uploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/40 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-foreground" />
          <span className="text-[10px] uppercase font-semibold tracking-wide text-foreground/80">
            Đang tải lên…
          </span>
        </div>
      )}

      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-destructive/15 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-[10px] font-semibold text-destructive text-center px-2 line-clamp-2">
            {item.error ?? 'Tải ảnh thất bại'}
          </span>
          {onRetry && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px]"
              onClick={onRetry}
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Thử lại
            </Button>
          )}
        </div>
      )}

      {!readOnly && (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="absolute top-1 right-1 h-7 w-7 opacity-90"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
