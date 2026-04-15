import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PriceBoardResponse } from '../api';

interface DeletePriceBoardDialogProps {
  item: PriceBoardResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DeletePriceBoardDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeletePriceBoardDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Xác nhận xóa bảng giá</DialogTitle>
          <DialogDescription className="py-2">
            Bạn có chắc chắn muốn xóa bảng giá cho nông sản 
            <span className="font-bold text-slate-900 mx-1">"{item.cropType}" (Hạng {item.grade})</span>? 
            Hành động này không thể hoàn tác và có thể ảnh hưởng đến các báo cáo lịch sử.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xóa...' : 'Đồng ý xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
