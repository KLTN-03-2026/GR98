import { useMemo, useState, useEffect, useCallback } from 'react';
import { CategoryFilters } from './CategoryFilters';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Layers,
  ImageIcon,
  RefreshCw,
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
import { DataTable } from '@/components/data-table';
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
import type { ColumnDef } from '@tanstack/react-table';
import FileUpload from '@/components/custom/file-upload';
import { uploadImage } from '@/client/api/upload';

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
  const [isUploading, setIsUploading] = useState(false);

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
          <DialogHeader className="p-0 border-b border-slate-50 relative overflow-hidden shrink-0 h-32 flex flex-col justify-end">
            <div className="absolute inset-0 bg-linear-to-b from-primary/[0.07] via-background to-background" />
            <div className="p-8 relative flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Layers className="size-7" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                  {mode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-primary/80 uppercase tracking-widest">
                  {mode === 'create'
                    ? 'Thiết lập phân loại hàng hóa mới'
                    : 'Cập nhật thông tin phân loại'}
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
                    className="rounded-2xl border-slate-200 h-12 focus-visible:ring-primary/20 focus-visible:border-primary font-bold text-slate-700 bg-slate-50/30 transition-all hover:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-slug" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Định danh (Slug)
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-300 font-mono group-focus-within:text-primary transition-colors">/</div>
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
                          ? "bg-primary/[0.04] border-primary/20 text-primary"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      )}
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    >
                      <Checkbox
                        checked={form.isActive}
                        onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
                        className={cn("border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary")}
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
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ảnh đại diện</Label>
                  <FileUpload
                    acceptedFileTypes={['image/*']}
                    onFileSelect={async (file) => {
                      setIsUploading(true);
                      try {
                        const uploaded = await uploadImage(file, 'categories');
                        setForm({ ...form, imageUrl: uploaded.url });
                      } catch {
                        toast.error('Lỗi tải ảnh danh mục');
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Đang tải ảnh lên...
                    </div>
                  )}
                  {form.imageUrl && !isUploading && (
                    <img src={form.imageUrl} alt="category" className="mt-2 h-20 w-20 rounded-xl object-cover border" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-desc" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Mô tả danh mục</Label>
                  <textarea
                    id="cat-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..."
                    className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-sm font-medium placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Premium Preview Section */}
            {(form.name || form.imageUrl) && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
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
                          <Badge className="bg-primary/10 text-primary border-none text-[8px] px-1.5 h-4 font-bold">ACTIVE</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium line-clamp-2 italic leading-relaxed">
                        {form.description || 'Chưa có mô tả chi tiết cho danh mục này...'}
                      </p>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 h-full w-1.5 bg-primary/10"></div>
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
              disabled={isUploading}
              className="rounded-full h-11 px-10 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200 flex items-center gap-3 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {isUploading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              <span className="text-[10px] uppercase tracking-[0.15em]">
                {isUploading ? 'Đang tải ảnh...' : mode === 'create' ? 'Tạo danh mục mới' : 'Lưu thay đổi'}
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
      <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl font-manrope overflow-hidden p-0">
        <div className="p-8 space-y-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-6 mt-4">
                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn xóa danh mục{' '}
                  <span className="font-black text-slate-900 underline decoration-rose-500/30 underline-offset-4 px-1">{category?.name}</span>?
                </p>
                {category && category.productCount && category.productCount > 0 ? (
                  <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50 flex gap-4 animate-pulse-subtle">
                    <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-sm">
                      <Trash2 className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-rose-800 uppercase tracking-[0.2em]">Cảnh báo dữ liệu</p>
                      <p className="text-xs font-bold text-rose-600/80 leading-relaxed">
                        Danh mục này đang chứa <strong className="text-rose-700">{category.productCount} sản phẩm</strong>.
                        Việc xóa danh mục sẽ khiến các sản phẩm này bị mất phân loại.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Hành động không thể hoàn tác</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center gap-3 mt-2">
            <AlertDialogCancel className="flex-1 rounded-2xl h-12 font-black text-slate-400 border-none hover:bg-slate-50 uppercase tracking-widest text-[10px]">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="flex-[2] rounded-2xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20"
            >
              Xác nhận xóa ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
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
  const filteredCategories = useMemo(() => categoriesRaw.filter(cat => {
    const statusOk = statusFilter === 'all' || (statusFilter === 'active' ? cat.isActive : !cat.isActive);
    return statusOk;
  }), [categoriesRaw, statusFilter]);
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

  const handleOpenEdit = useCallback((cat: CategoryResponse) => {
    setMode('edit');
    setSelected(cat);
    setDialogOpen(true);
  }, []);

  const handleOpenDelete = useCallback((cat: CategoryResponse) => {
    setSelected(cat);
    setDeleteOpen(true);
  }, []);

  const handleSubmit = async (formData: CategoryFormData) => {
    try {
      if (mode === 'create') {
        await createCategory.mutateAsync(formData);
      } else if (selected) {
        await updateCategory.mutateAsync({ id: selected.id, data: formData });
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

  const sortedCategories = useMemo(
    () => [...filteredCategories].sort((a, b) => a.sortOrder - b.sortOrder),
    [filteredCategories],
  );

  const columns = useMemo<ColumnDef<CategoryResponse>[]>(
    () => [
      {
        id: 'drag',
        header: '',
        enableSorting: false,
        cell: () => (
          <div className="flex items-center justify-center">
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50 transition-colors group-hover:text-primary/60 active:cursor-grabbing" />
          </div>
        ),
      },
      {
        accessorKey: 'imageUrl',
        header: 'Hình ảnh',
        cell: ({ row }) => (
          <div className="relative h-10 w-14 overflow-hidden rounded-lg border bg-muted">
            {row.original.imageUrl ? (
              <img
                src={row.original.imageUrl}
                alt={row.original.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Tên danh mục',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{row.original.name}</p>
            {row.original.description && (
              <p className="line-clamp-1 max-w-[300px] text-xs text-muted-foreground">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">/{row.original.slug}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Trạng thái</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.isActive ? (
              <Badge className="border-none bg-emerald-500/10 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/15">
                Hoạt động
              </Badge>
            ) : (
              <Badge className="border-none bg-muted text-[10px] font-bold text-muted-foreground">
                Tạm dừng
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'productCount',
        header: () => <div className="text-center">Sản phẩm</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm font-medium">{row.original.productCount ?? 0}</div>
        ),
      },
      {
        accessorKey: 'sortOrder',
        header: () => <div className="text-center">Thứ tự</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm font-medium">{row.original.sortOrder}</div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => handleOpenEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
              onClick={() => handleOpenDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleOpenDelete, handleOpenEdit],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
            <Layers className="size-4 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý danh mục
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tổ chức và phân loại sản phẩm nông sản trên hệ thống.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary" className="font-semibold">
            Tổng cộng: {data?.total ?? 0} danh mục
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={sortedCategories}
            isLoading={isLoading}
            hiddenSearch
            enableSorting={false}
            filterToolbar={
              <div className="flex w-full flex-wrap items-end justify-between gap-3">
                <CategoryFilters
                  search={search}
                  onSearchChange={setSearch}
                  status={statusFilter}
                  onStatusChange={handleStatusChange}
                />
                <Button onClick={handleOpenCreate} className="h-9 shrink-0">
                  <Plus className="size-4 mr-2" />
                  Thêm mới
                </Button>
              </div>
            }
            noResults={
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <Layers className="size-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Chưa có danh mục nào</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bắt đầu thiết lập hệ thống phân loại sản phẩm.
                </p>
                <Button variant="outline" onClick={handleOpenCreate} className="mt-4">
                  Khởi tạo danh mục đầu tiên
                </Button>
              </div>
            }
            getRowProps={(cat) => ({
              draggable: true,
              onDragStart: (event) => handleDragStart(event, cat.id),
              onDragEnd: handleDragEnd,
              onDragOver: handleDragOverRow,
              onDrop: (event) => void handleDropOnRow(event, cat.id),
              className: cn(
                'group transition-all',
                dragId === cat.id && 'opacity-50 bg-muted scale-[0.99] border-y-primary/20',
              ),
            })}
          />
        </CardContent>
      </Card>

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
