import { useState, useEffect } from 'react';
import { CategoryFilters } from './CategoryFilters';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  GripVertical,
  Layers,
  FilterX,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, type CategoryResponse } from '@/client/api';
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from './api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Category Form ────────────────────────────────────────────────────────────

import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingBag } from 'lucide-react';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  category?: CategoryResponse;
  onSubmit: (data: CategoryFormData) => void;
}

function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  onSubmit,
}: CategoryDialogProps) {
  const [form, setForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: true,
  });

  // Sync form when category changes (edit mode)
  useEffect(() => {
    if (open) {
      if (category && mode === 'edit') {
        setForm({
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          imageUrl: category.imageUrl ?? '',
          sortOrder: category.sortOrder,
          isActive: category.isActive ?? true,
        });
      } else {
        setForm({
          name: '',
          slug: '',
          description: '',
          imageUrl: '',
          sortOrder: 0,
          isActive: true,
        });
      }
    }
  }, [category, mode, open]);

  const handleNameChange = (name: string) => {
    const slug = toSlug(name);
    setForm({ ...form, name, slug });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-none shadow-2xl rounded-[2rem] overflow-hidden p-0 font-manrope">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pb-6 bg-white shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                <Layers className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                  {mode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-400 mt-1">
                  {mode === 'create'
                    ? 'Thiết lập danh mục sản phẩm mới để phân loại hàng hóa trong hệ thống.'
                    : 'Cập nhật thông tin và trạng thái hiển thị cho danh mục sản phẩm.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info Section */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cat-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Tên danh mục <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="cat-name"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Trái cây nhiệt đới"
                    className="rounded-2xl border-slate-200 h-12 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 font-bold text-slate-700 bg-slate-50/30 transition-all hover:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-slug" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Định danh (Slug)
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-300 font-mono group-focus-within:text-emerald-400 transition-colors">/</div>
                    <Input
                      id="cat-slug"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="trai-cay-nhiet-doi"
                      className="rounded-2xl border-slate-200 bg-slate-50/50 font-mono text-xs pl-8 h-12 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-order" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Thứ tự
                    </Label>
                    <Input
                      id="cat-order"
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                      }
                      className="rounded-2xl border-slate-200 h-12 font-mono font-bold text-center bg-slate-50/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Trạng thái</Label>
                    <div
                      className={cn(
                        "flex items-center gap-3 h-12 px-4 rounded-2xl border transition-all cursor-pointer select-none",
                        form.isActive
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      )}
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    >
                      <Checkbox
                        checked={form.isActive}
                        onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
                        className={cn("border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600")}
                      />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {form.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media & Description Section */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cat-image" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ảnh đại diện (URL)</Label>
                  <div className="relative group">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                      id="cat-image"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="pl-10 rounded-2xl border-slate-200 h-12 text-xs bg-slate-50/30 transition-all hover:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-desc" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Mô tả danh mục</Label>
                  <textarea
                    id="cat-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..."
                    className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-sm font-medium placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Premium Preview Section */}
            {(form.name || form.imageUrl) && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-6 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-24 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-inner">
                      {form.imageUrl ? (
                        <img
                          src={form.imageUrl}
                          alt="preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-slate-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg font-bold text-slate-900 truncate">{form.name || 'Tên danh mục'}</p>
                        {form.isActive && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] px-1.5 h-4">ACTIVE</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium line-clamp-2 italic leading-relaxed">
                        {form.description || 'Chưa có mô tả chi tiết cho danh mục này...'}
                      </p>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-500/10"></div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-8 py-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-11 px-8 font-bold text-slate-400 hover:bg-white hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="rounded-full h-11 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-500/20 flex items-center gap-3 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShoppingBag className="size-4" />
              <span className="text-[10px] uppercase tracking-[0.15em]">
                {mode === 'create' ? 'Tạo danh mục mới' : 'Lưu thay đổi'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryResponse | null;
  onConfirm: () => void;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
}: DeleteConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border-none shadow-2xl font-manrope">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-slate-900">Xóa danh mục</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500">
                Bạn có chắc chắn muốn xóa danh mục{' '}
                <span className="font-bold text-slate-900 underline decoration-rose-200 underline-offset-4">{category?.name}</span>?
              </p>
              {category && category.productCount && category.productCount > 0 ? (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-3">
                  <div className="size-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Cảnh báo dữ liệu</p>
                    <p className="text-xs font-medium text-rose-600 leading-relaxed">
                      Danh mục này đang chứa <strong>{category.productCount} sản phẩm</strong>.
                      Việc xóa danh mục sẽ khiến các sản phẩm này không còn thuộc nhóm nào.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                  Hành động này không thể hoàn tác.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel className="rounded-full h-10 px-6 font-bold text-slate-500 border-none hover:bg-slate-50">Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full h-10 px-8 bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            Xác nhận xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CategoriesAdminPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<CategoryResponse | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data, isLoading } = useCategories({ search: search || undefined, limit: 100 });
  const categoriesRaw = data?.data ?? [];
  const filteredCategories = categoriesRaw.filter(cat => {
    const statusOk = statusFilter === 'all' || (statusFilter === 'active' ? cat.isActive : !cat.isActive);
    return statusOk;
  });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  const categories = data?.data ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setMode('create');
    setSelected(null);
    setDialogOpen(true);
  };

  // Wrapper to match CategoryFilters signature
  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
  };

  const handleOpenEdit = (cat: CategoryResponse) => {
    setMode('edit');
    setSelected(cat);
    setDialogOpen(true);
  };

  const handleOpenDelete = (cat: CategoryResponse) => {
    setSelected(cat);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData: CategoryFormData) => {
    try {
      if (mode === 'create') {
        await createCategory.mutateAsync(formData);
        toast.success('Đã tạo danh mục mới');
      } else if (selected) {
        await updateCategory.mutateAsync({ id: selected.id, data: formData });
        toast.success('Đã cập nhật danh mục');
      }
      setDialogOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteCategory.mutateAsync(selected.id);
      toast.success('Đã xóa danh mục');
      setDeleteOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragEnd = () => {
    setDragId(null);
  };

  /** Bắt buộc preventDefault thì trình duyệt mới cho phép thả (drop). */
  const handleDragOverRow = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /** Gọi API reorder một lần khi thả — không dùng await trong hàm không async. */
  const handleDropOnRow = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragId;
    if (!sourceId || sourceId === targetId) return;

    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIndex = sorted.findIndex((c) => c.id === sourceId);
    const toIndex = sorted.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    const orders = sorted.map((c, i) => ({ id: c.id, sortOrder: i }));
    await reorderCategories.mutateAsync(orders);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 p-4 sm:p-6 font-manrope">
      {/* Header Card - Admin Style */}
      <Card className="border-dashed border-emerald-400/50 bg-white">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Layers className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Quản lý danh mục
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Tổ chức và phân loại sản phẩm trên sàn thương mại
            </p>
          </div>

          <CategoryFilters
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={handleStatusChange}
          />
          <Button
            onClick={handleOpenCreate}
            className="h-9 rounded-full px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="size-4" />
            Thêm mới
          </Button>
        </CardContent>
      </Card>

      {/* Info Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
          <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-600 font-bold px-1.5 h-5 rounded-md min-w-6 justify-center">
            {data?.total ?? 0}
          </Badge>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Danh mục hệ thống</span>
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch('')}
            className="h-8 rounded-full px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-xs font-bold"
          >
            <FilterX className="size-3.5 mr-1" />
            Xóa tìm kiếm
          </Button>
        )}
      </div>

      {/* Table Section */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="h-full overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
              <TableRow className="border-b-slate-100 hover:bg-transparent">
                <TableHead className="w-12" />
                <TableHead className="w-24 text-[10px] font-bold uppercase tracking-wider text-slate-500">Hình ảnh</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tên danh mục</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Slug</TableHead>
                <TableHead className="w-24 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</TableHead>
                <TableHead className="w-32 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Sản phẩm</TableHead>
                <TableHead className="w-24 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Thứ tự</TableHead>
                <TableHead className="w-32 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-slate-50">
                    <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-16 rounded-xl" /></TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8 mx-auto rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-20 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="mb-4 rounded-full bg-slate-50 p-6 border border-dashed border-slate-200">
                        <Plus className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Chưa có danh mục nào</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                        Bắt đầu tạo danh mục đầu tiên để phân loại và trưng bày sản phẩm.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleOpenCreate}
                        className="mt-6 rounded-full px-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold"
                      >
                        Thiết lập ngay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((cat) => (
                    <TableRow
                      key={cat.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cat.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOverRow}
                      onDrop={(e) => void handleDropOnRow(e, cat.id)}
                      className={cn(
                        'group transition-all border-b-slate-50 hover:bg-emerald-50/30',
                        dragId === cat.id && 'opacity-50 bg-slate-100 scale-[0.99] border-y-emerald-500/50',
                      )}
                    >
                      {/* Drag Handle */}
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <GripVertical className="h-4 w-4 text-slate-200 group-hover:text-emerald-400 transition-colors cursor-grab active:cursor-grabbing" />
                        </div>
                      </TableCell>

                      {/* Image */}
                      <TableCell>
                        <div className="relative h-10 w-14 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-xs">
                          {cat.imageUrl ? (
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-slate-200" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm">{cat.name}</p>
                          {cat.description && (
                            <p className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[300px]">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Slug */}
                      <TableCell>
                        <code className="text-[10px] font-mono font-bold bg-slate-50 px-2 py-0.5 rounded-md text-slate-400 border border-slate-100 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                          {cat.slug}
                        </code>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {cat.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-bold px-2 py-0.5">ACTIVE</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-bold px-2 py-0.5">DISABLED</Badge>
                        )}
                      </TableCell>

                      {/* Product Count */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-lg px-2 h-6 font-bold shadow-none border-none tabular-nums',
                            cat.productCount ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          {cat.productCount ?? 0}
                        </Badge>
                      </TableCell>

                      {/* Sort Order */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 font-mono text-xs font-bold text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                          {cat.sortOrder}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full hover:bg-white hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
                            onClick={() => handleOpenEdit(cat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all"
                            onClick={() => handleOpenDelete(cat)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 shadow-xs">
          <GripVertical className="h-3 w-3" />
          Kéo thả các dòng để sắp xếp thứ tự hiển thị
        </div>
      </div>

      {/* Dialogs */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        category={selected ?? undefined}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={selected}
        onConfirm={handleDelete}
      />
    </div>
  );
}
