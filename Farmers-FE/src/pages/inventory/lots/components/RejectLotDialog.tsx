import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { InventoryLot } from '../api/types';
import { useRejectLot } from '../api/hooks';
import { toast } from 'sonner';

interface RejectLotDialogProps {
  lot: InventoryLot;
  isOpen: boolean;
  onClose: () => void;
}

export function RejectLotDialog({ lot, isOpen, onClose }: RejectLotDialogProps) {
  const [reason, setReason] = useState('');
  const rejectMutation = useRejectLot();

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        lotId: lot.id,
        reason: reason.trim(),
      });
      toast.success(`Đã từ chối lô hàng ${lot.id.slice(-8).toUpperCase()} thành công`);
      onClose();
      setReason('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi từ chối lô hàng';
      toast.error(`Thất bại: ${errorMessage}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            Từ chối lô hàng
          </DialogTitle>
          <DialogDescription>
            Bạn đang thực hiện từ chối nhận lô hàng này. Hành động này sẽ đánh dấu lô hàng là không đạt yêu cầu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-2 border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã lô:</span>
              <span className="font-mono font-medium">{lot.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sản phẩm:</span>
              <span className="font-medium">{lot.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phẩm cấp:</span>
              <Badge variant="outline" className="font-bold">{lot.qualityGrade}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold">
              Lý do từ chối <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do chi tiết (ví dụ: hàng bị mốc, sai quy cách, thiếu số lượng...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={rejectMutation.isPending}>
            Hủy bỏ
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject} 
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
