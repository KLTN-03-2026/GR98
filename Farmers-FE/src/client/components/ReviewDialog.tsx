import { useState } from 'react';
import { Star, Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCreateReview } from '@/client/api/reviews';
import { useImageUploader } from '@/client/hooks/use-image-uploader';
import { ImageUploadTile } from '@/client/components/image-upload-tile';
import { toast } from 'sonner';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

const MAX_IMAGES = 5;

export function ReviewDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSuccess,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const uploader = useImageUploader({ folder: 'reviews', maxImages: MAX_IMAGES });

  const createReview = useCreateReview(productId);

  const reset = () => {
    setRating(0);
    setHovered(0);
    setComment('');
    uploader.clear();
  };

  const handleClose = () => {
    if (!createReview.isPending && !uploader.isUploading) {
      reset();
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning('Vui lòng chọn số sao');
      return;
    }
    try {
      await createReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
        imageUrls: uploader.urls,
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // error toast handled in hook
    }
  };

  const starLabels = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-bold">Đánh giá sản phẩm</DialogTitle>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{productName}</p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Star rating */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Chất lượng sản phẩm <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      'size-8 transition-colors',
                      star <= (hovered || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-100 text-slate-200',
                    )}
                  />
                </button>
              ))}
              {(hovered || rating) > 0 && (
                <span className="ml-2 text-sm font-medium text-amber-600">
                  {starLabels[hovered || rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Nhận xét</Label>
            <Textarea
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
              className="resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Hình ảnh thực tế{' '}
              <span className="font-normal text-muted-foreground">(tùy chọn, tối đa {MAX_IMAGES} ảnh)</span>
            </Label>

            <div className="grid grid-cols-4 gap-2">
              {uploader.items.map((item) => (
                <ImageUploadTile
                  key={item.id}
                  item={item}
                  onRemove={() => uploader.remove(item.id)}
                  onRetry={() => void uploader.retry(item.id)}
                  className="aspect-square"
                />
              ))}

              {uploader.items.length < MAX_IMAGES && (
                <label
                  className={cn(
                    'aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors',
                  )}
                >
                  <Upload className="size-4 text-muted-foreground mb-0.5" />
                  <span className="text-[9px] text-muted-foreground font-medium">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      void uploader.addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={handleClose} disabled={createReview.isPending || uploader.isUploading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || createReview.isPending || uploader.isUploading}
            className="min-w-[120px]"
          >
            {createReview.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : uploader.isUploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Đang tải ảnh...
              </>
            ) : (
              'Gửi đánh giá'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
