import { useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  GripVertical,
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

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
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
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    imageUrl: category?.imageUrl ?? '',
    sortOrder: category?.sortOrder ?? 0,
  });

  // Sync form when category changes (edit mode)
  useState(() => {
    if (category && mode === 'edit') {
      setForm({
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        imageUrl: category.imageUrl ?? '',
        sortOrder: category.sortOrder,
      });
    }
  });

  const handleNameChange = (name: string) => {
    const slug = form.slug || toSlug(name);
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Điền thông tin để tạo danh mục phân loại sản phẩm.'
                : 'Cập nhật thông tin danh mục.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Trái cây nhiệt đới"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="trai-cay-nhiet-doi"
              />
              <p className="text-xs text-muted-foreground">
                Đường dẫn: /products?categoryId=<span className="font-mono font-semibold">{form.slug || 'slug'}</span>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Mô tả</Label>
              <textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về danh mục..."
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-image">Ảnh danh mục</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cat-image"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="pl-10"
                  />
                </div>
                {form.imageUrl && (
                  <div className="relative h-10 w-14 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-order">Thứ tự hiển thị</Label>
              <Input
                id="cat-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa danh mục</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              Bạn có chắc muốn xóa danh mục{' '}
              <span className="font-semibold text-foreground">{category?.name}</span>?
              {category && category.productCount && category.productCount > 0 ? (
                <div className="mt-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                  ⚠️ Danh mục này đang có <strong>{category.productCount} sản phẩm</strong>.
                  Sản phẩm sẽ không bị xóa nhưng sẽ không còn thuộc danh mục này.
                </div>
              ) : (
                <span className="block mt-1">
                  Hành động này không thể hoàn tác.
                </span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Xóa danh mục
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CategoriesAdminPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<CategoryResponse | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data, isLoading } = useCategories({ search: search || undefined, limit: 100 });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Phân loại sản phẩm trên cửa hàng E-Commerce
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {data?.total ?? 0} danh mục
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-3 py-3" />
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
                Hình ảnh
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
                Tên danh mục
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
                Slug
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-muted-foreground">
                Số sản phẩm
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-muted-foreground">
                Thứ tự
              </th>
              <th className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-3"><Skeleton className="h-4 w-4 rounded" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-10 w-14 rounded-md" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-3 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                  <td className="px-3 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📦</div>
                    <p className="font-medium">Chưa có danh mục nào</p>
                    <p className="text-sm">Tạo danh mục đầu tiên để phân loại sản phẩm</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 rounded-lg"
                      onClick={handleOpenCreate}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tạo danh mục
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              categories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => (
                  <tr
                    key={cat.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, cat.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOverRow}
                    onDrop={(e) => void handleDropOnRow(e, cat.id)}
                    className={cn(
                      'border-b last:border-0 transition-all',
                      dragId === cat.id && 'opacity-50 bg-muted/50',
                    )}
                  >
                    {/* Drag Handle */}
                    <td className="px-3 py-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </td>

                    {/* Image */}
                    <td className="px-3 py-3">
                      <div className="h-10 w-14 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                        {cat.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-3 py-3">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {cat.slug}
                      </code>
                    </td>

                    {/* Product Count */}
                    <td className="px-3 py-3 text-center">
                      <Badge variant={cat.productCount ? 'default' : 'outline'}>
                        {cat.productCount ?? 0}
                      </Badge>
                    </td>

                    {/* Sort Order */}
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-muted-foreground font-mono">
                        {cat.sortOrder}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(cat)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Kéo thả cột để sắp xếp thứ tự hiển thị. Thứ tự sẽ tự động lưu.
      </p>

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
