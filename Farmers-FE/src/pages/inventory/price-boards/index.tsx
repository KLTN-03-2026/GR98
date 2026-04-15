import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  usePriceBoards,
  useCreatePriceBoard,
  useUpdatePriceBoard,
  useTogglePriceBoardActive,
  useDeletePriceBoard,
  type PriceBoardResponse,
} from './api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const GRADES = [
  { value: 'A', label: 'Grade A — Loại 1', color: 'emerald' as const },
  { value: 'B', label: 'Grade B — Loại 2', color: 'warning' as const },
  { value: 'C', label: 'Grade C — Loại 3', color: 'orange' as const },
  { value: 'REJECT', label: 'Reject — Loại kém', color: 'destructive' as const },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

// ─── Form DTO ────────────────────────────────────────────────────────────────

interface PriceBoardFormData {
  cropType: string;
  grade: PriceBoardResponse['grade'];
  buyPrice: string;
  sellPrice: string;
  effectiveDate: string;
}

const EMPTY_FORM: PriceBoardFormData = {
  cropType: '',
  grade: 'A',
  buyPrice: '',
  sellPrice: '',
  effectiveDate: new Date().toISOString().split('T')[0],
};

// ─── Skeleton row ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Form Dialog ─────────────────────────────────────────────────────────────

interface PriceBoardFormDialogProps {
  mode: 'create' | 'edit';
  initial?: PriceBoardResponse;
  onSuccess?: () => void;
}

function PriceBoardFormDialog({ mode, initial, onSuccess }: PriceBoardFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PriceBoardFormData>(
    initial
      ? {
          cropType: initial.cropType,
          grade: initial.grade,
          buyPrice: initial.buyPrice.toString(),
          sellPrice: initial.sellPrice.toString(),
          effectiveDate: initial.effectiveDate.split('T')[0],
        }
      : EMPTY_FORM,
  );

  const createMutation = useCreatePriceBoard();
  const updateMutation = useUpdatePriceBoard();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEdit = mode === 'edit';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const buyPrice = parseFloat(form.buyPrice);
    const sellPrice = parseFloat(form.sellPrice);

    if (isNaN(buyPrice) || buyPrice <= 0) {
      toast.error('Giá mua vào phải lớn hơn 0');
      return;
    }
    if (isNaN(sellPrice) || sellPrice <= 0) {
      toast.error('Giá bán ra phải lớn hơn 0');
      return;
    }
    if (buyPrice > sellPrice) {
      toast.error('Giá mua vào không được lớn hơn giá bán ra');
      return;
    }

    const payload = {
      cropType: form.cropType.trim(),
      grade: form.grade,
      buyPrice,
      sellPrice,
      effectiveDate: form.effectiveDate,
    };

    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      onSuccess?.();
    } catch {
      // toast đã xử lý trong hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          onClick={() => {
            if (isEdit && initial) {
              setForm({
                cropType: initial.cropType,
                grade: initial.grade,
                buyPrice: initial.buyPrice.toString(),
                sellPrice: initial.sellPrice.toString(),
                effectiveDate: initial.effectiveDate.split('T')[0],
              });
            } else {
              setForm(EMPTY_FORM);
            }
          }}
        >
          <Plus className="size-4 mr-1" />
          {isEdit ? 'Sửa' : 'Thêm bảng giá'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Cập nhật bảng giá' : 'Tạo bảng giá mới'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Cập nhật bảng giá cho "${initial?.cropType}" — Grade ${initial?.grade}`
              : 'Điền thông tin bảng giá cho nông sản của bạn'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loại nông sản */}
          <div className="space-y-1.5">
            <Label htmlFor="cropType">Loại nông sản</Label>
            <Input
              id="cropType"
              placeholder="Ví dụ: Thanh long, Xoài, Cam..."
              value={form.cropType}
              onChange={(e) => setForm((f) => ({ ...f, cropType: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          {/* Grade */}
          <div className="space-y-1.5">
            <Label htmlFor="grade">Phẩm cấp</Label>
            <Select
              value={form.grade}
              onValueChange={(v) => setForm((f) => ({ ...f, grade: v as PriceBoardResponse['grade'] }))}
              disabled={isLoading}
            >
              <SelectTrigger id="grade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Giá mua / Giá bán */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="buyPrice">Giá mua vào (VNĐ/kg)</Label>
              <Input
                id="buyPrice"
                type="number"
                min="0"
                step="100"
                placeholder="15000"
                value={form.buyPrice}
                onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sellPrice">Giá bán ra (VNĐ/kg)</Label>
              <Input
                id="sellPrice"
                type="number"
                min="0"
                step="100"
                placeholder="25000"
                value={form.sellPrice}
                onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Ngày có hiệu lực */}
          <div className="space-y-1.5">
            <Label htmlFor="effectiveDate">Ngày có hiệu lực</Label>
            <Input
              id="effectiveDate"
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo bảng giá'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ───────────────────────────────────────────────────────────

function DeleteDialog({ item, onSuccess }: { item: PriceBoardResponse; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeletePriceBoard();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(item.id);
      setOpen(false);
      onSuccess?.();
    } catch {
      // toast đã xử lý trong hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa bảng giá</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa bảng giá "{item.cropType} — Grade {item.grade}" không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteMutation.isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={deleteMutation.isPending}>
            Xóa bảng giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PriceBoardsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');

  const { data, isLoading, isFetching } = usePriceBoards({
    page,
    limit: 20,
    cropType: search || undefined,
    grade: gradeFilter || undefined,
    isActive: isActiveFilter || undefined,
  });

  const toggleMutation = useTogglePriceBoardActive();

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const handleToggle = async (item: PriceBoardResponse) => {
    try {
      await toggleMutation.mutateAsync(item.id);
    } catch {
      // toast đã xử lý trong hook
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Thiết lập bảng giá</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Quản lý giá mua vào / bán ra theo từng loại nông sản và phẩm cấp
          </p>
        </div>
        <PriceBoardFormDialog mode="create" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4" />
                <Input
                  placeholder="Tìm theo loại nông sản..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <Select
              value={gradeFilter}
              onValueChange={(v) => {
                setGradeFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Phẩm cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phẩm cấp</SelectItem>
                {GRADES.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={isActiveFilter}
              onValueChange={(v) => {
                setIsActiveFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Danh sách bảng giá
            <span className="text-muted-foreground font-normal ml-2 text-sm">
              ({total} bảng giá)
            </span>
          </CardTitle>
          <CardDescription>
            Mỗi loại nông sản + phẩm cấp chỉ có 1 bản ghi đang active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <Search className="text-muted-foreground size-6" />
              </div>
              <p className="font-medium">Không tìm thấy bảng giá nào</p>
              <p className="text-muted-foreground text-sm mt-1">
                Thử thay đổi bộ lọc hoặc tạo bảng giá mới
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 font-medium">Loại nông sản</th>
                      <th className="pb-3 pr-4 font-medium">Phẩm cấp</th>
                      <th className="pb-3 pr-4 font-medium text-right">Giá mua vào</th>
                      <th className="pb-3 pr-4 font-medium text-right">Giá bán ra</th>
                      <th className="pb-3 pr-4 font-medium text-right">Hiệu lực từ</th>
                      <th className="pb-3 pr-4 font-medium">Trạng thái</th>
                      <th className="pb-3 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="py-3 pr-4 font-medium">{item.cropType}</td>
                        <td className="py-3 pr-4">
                          <GradeBadge grade={item.grade} />
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-green-600">
                          {formatCurrency(item.buyPrice)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-blue-600">
                          {formatCurrency(item.sellPrice)}
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">
                          {formatDate(item.effectiveDate)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={item.isActive ? 'success' : 'secondary'}
                            className="whitespace-nowrap"
                          >
                            {item.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <PriceBoardFormDialog
                              mode="edit"
                              initial={item}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggle(item)}
                              disabled={toggleMutation.isPending}
                              className={cn(
                                'size-8',
                                !item.isActive && 'text-emerald-600 hover:text-emerald-700',
                              )}
                            >
                              <Power className="size-4" />
                            </Button>
                            <DeleteDialog item={item} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{item.cropType}</p>
                        <GradeBadge grade={item.grade} />
                      </div>
                      <Badge variant={item.isActive ? 'success' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Tạm dừng'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Giá mua</p>
                        <p className="font-mono text-green-600 font-medium">{formatCurrency(item.buyPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Giá bán</p>
                        <p className="font-mono text-blue-600 font-medium">{formatCurrency(item.sellPrice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t">
                      <PriceBoardFormDialog mode="edit" initial={item} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(item)}
                        disabled={toggleMutation.isPending}
                        className={cn(
                          'size-8',
                          !item.isActive && 'text-emerald-600 hover:text-emerald-700',
                        )}
                      >
                        <Power className="size-4" />
                      </Button>
                      <DeleteDialog item={item} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages} — {total} bảng giá
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isFetching}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Grade Badge ─────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: PriceBoardResponse['grade'] }) {
  const config = GRADES.find((g) => g.value === grade) ?? GRADES[0];
  return (
    <Badge variant={config.color} className="capitalize">
      {config.label.split(' — ')[0]}
    </Badge>
  );
}
