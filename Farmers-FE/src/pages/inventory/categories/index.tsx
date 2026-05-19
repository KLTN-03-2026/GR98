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
import { useSingleImageUploader } from '@/client/hooks/use-image-uploader';
import { ImageUploadTile } from '@/client/components/image-upload-tile';

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
  const uploader = useSingleImageUploader({
    folder: 'categories',
    onChange: (url) => setForm((prev) => ({ ...prev, imageUrl: url ?? '' })),
  });
  const isUploading = uploader.isUploading;

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
        uploader.setFromUrl(category.imageUrl ?? null);
      } else {
        setForm({
          name: '',
          slug: '',
          description: '',
          imageUrl: '',
          sortOrder: 0,
          isActive: true,
        });
        uploader.clear();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <DialogContent className="sm:max-w-2xl p-0 font-manrope shadow-2xl gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* HEADER */}
          <DialogHeader className="shrink-0 border-b bg-gradient-to-b from-primary/[0.06] to-transparent px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Layers className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground">
                  {mode === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {mode === 'create'
                    ? 'Thiết lập phân loại hàng hóa mới'
                    : 'Cập nhật thông tin phân loại'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Cột trái — Thông tin cơ bản */}
              <section className="rounded-xl border bg-card p-4 space-y-4">
                <header className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Layers className="size-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Thông tin cơ bản
                  </h3>
                </header>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="cat-name"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Tên danh mục <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="cat-name"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Trái cây nhiệt đới"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="cat-slug"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Định danh (Slug)
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                      /
                    </span>
                    <Input
                      id="cat-slug"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="trai-cay-nhiet-doi"
                      className="pl-6 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="cat-order"
                      className="text-[11px] font-medium text-muted-foreground"
                    >
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
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Trạng thái
                    </Label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className={cn(
                        'flex h-9 w-full items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors select-none',
                        form.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500',
                      )}
                    >
                      <Checkbox
                        checked={form.isActive}
                        onCheckedChange={(checked) =>
                          setForm({ ...form, isActive: !!checked })
                        }
                        className={cn(
                          'pointer-events-none',
                          form.isActive &&
                            'border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500',
                        )}
                      />
                      <span>{form.isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Cột phải — Ảnh & Mô tả */}
              <section className="rounded-xl border bg-card p-4 space-y-4">
                <header className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <ImageIcon className="size-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Hình ảnh & mô tả
                  </h3>
                </header>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Ảnh đại diện
                  </Label>
                  <FileUpload
                    acceptedFileTypes={['image/*']}
                    onFileSelect={(file) => void uploader.upload(file)}
                  />
                  {uploader.item && (
                    <div className="mt-2 inline-block w-32">
                      <ImageUploadTile
                        item={uploader.item}
                        onRemove={uploader.clear}
                        onRetry={() => void uploader.retry()}
                        className="aspect-square"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="cat-desc"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Mô tả danh mục
                  </Label>
                  <textarea
                    id="cat-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..."
                    className="w-full min-h-[96px] resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
              </section>
            </div>

            {/* Preview */}
            {(form.name || form.imageUrl) && (
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Xem trước
                </p>
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-md border bg-slate-50">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt="preview"
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ImageIcon className="size-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {form.name || 'Tên danh mục'}
                      </p>
                      {form.isActive ? (
                        <Badge className="h-4 border-emerald-200 bg-emerald-50 px-1.5 text-[9px] font-semibold text-emerald-700">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[9px] font-semibold text-muted-foreground"
                        >
                          INACTIVE
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {form.description || 'Chưa có mô tả chi tiết cho danh mục này.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <DialogFooter className="shrink-0 border-t bg-background px-6 py-3 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isUploading} className="gap-1.5">
              {isUploading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              {isUploading
                ? 'Đang tải ảnh...'
                : mode === 'create'
                  ? 'Tạo danh mục'
                  : 'Lưu thay đổi'}
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
  const hasProducts = !!category?.productCount && category.productCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="font-manrope sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Trash2 className="size-5" />
          </div>
          <AlertDialogTitle className="text-lg font-bold text-foreground">
            Xác nhận xoá danh mục
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bạn có chắc chắn muốn xoá danh mục{' '}
                <span className="font-semibold text-foreground">
                  "{category?.name}"
                </span>
                ? Hành động này không thể hoàn tác.
              </p>
              {hasProducts && (
                <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50/60 p-3">
                  <Trash2 className="mt-0.5 size-4 shrink-0 text-rose-600" />
                  <div className="text-xs text-rose-700 leading-relaxed">
                    Danh mục này đang chứa{' '}
                    <strong>{category!.productCount} sản phẩm</strong>. Khi xoá,
                    các sản phẩm này sẽ bị mất phân loại.
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Xoá danh mục
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
