import { useState, useEffect } from 'react';
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
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    sortOrder: 0,
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
        });
      } else {
        setForm({
          name: '',
          slug: '',
          description: '',
          imageUrl: '',
          sortOrder: 0,
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
      <DialogContent className="sm:max-w-md border-none bg-background/80 backdrop-blur-xl shadow-2xl rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {mode === 'create' ? '✨ Thêm danh mục mới' : '📝 Chỉnh sửa danh mục'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80">
              {mode === 'create'
                ? 'Điền thông tin để tạo danh mục phân loại sản phẩm trên hệ thống.'
                : 'Cập nhật lại thông tin định danh cho danh mục này.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-sm font-semibold">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Trái cây nhiệt đới"
                className="rounded-xl border-muted-foreground/20 focus:border-primary/50 transition-all shadow-sm"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="cat-slug" className="text-sm font-semibold">Slug (Đường dẫn)</Label>
              <div className="relative">
                <Input
                  id="cat-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="trai-cay-nhiet-doi"
                  className="rounded-xl border-muted-foreground/20 bg-muted/30 font-mono text-xs pl-10 h-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">/</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic pl-1">
                Gợi ý: <span className="font-mono">{form.slug || 'slug-tu-dong'}</span>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cat-desc" className="text-sm font-semibold">Mô tả</Label>
              <textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn gọn về nhóm sản phẩm này..."
                className="w-full min-h-[100px] rounded-xl border border-muted-foreground/20 bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all shadow-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Image URL */}
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="cat-image" className="text-sm font-semibold">Ảnh danh mục</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="cat-image"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="Dán link ảnh"
                    className="pl-10 rounded-xl border-muted-foreground/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="cat-order" className="text-sm font-semibold">Thứ tự hiển thị</Label>
                <Input
                  id="cat-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  className="rounded-xl border-muted-foreground/20 shadow-sm"
                />
              </div>
            </div>

            {/* Preview Section */}
            {form.imageUrl && form.name && (
              <div className="p-3 rounded-xl border border-primary/10 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary/60 mb-2">Xem trước hiển thị</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-16 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-muted shrink-0">
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{form.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{form.description || 'Không có mô tả'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 bg-muted/30 -mx-6 -mb-6 p-6 mt-2 border-t border-muted/50 rounded-b-2xl">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl hover:bg-background/50"
            >
              Hủy bỏ
            </Button>
            <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all">
              {mode === 'create' ? 'Tạo danh mục' : 'Lưu cập nhật'}
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            Quản lý danh mục
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Phân loại sản phẩm chuyên nghiệp cho sàn thương mại điện tử
          </p>
        </div>
        <Button 
          onClick={handleOpenCreate} 
          className="gap-2 rounded-xl px-6 py-6 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 font-bold"
        >
          <Plus className="h-5 w-5" />
          Thêm danh mục mới
        </Button>
      </div>

      {/* Top Bar with Search & Info */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-muted/50 backdrop-blur-sm">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border-none bg-background/50 shadow-inner focus-visible:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-xl border border-muted/30 shadow-sm">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-bold">
            {data?.total ?? 0}
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Danh mục hiện có</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative group/table">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-primary/0 rounded-[2rem] blur-2xl opacity-50 group-hover/table:opacity-100 transition duration-1000" />
        <div className="relative rounded-2xl border border-muted/50 bg-background/50 backdrop-blur-md overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12" />
                <TableHead className="w-24 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Hình ảnh</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Tên danh mục</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Định danh (Slug)</TableHead>
                <TableHead className="w-32 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Sản phẩm</TableHead>
                <TableHead className="w-32 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Thứ tự</TableHead>
                <TableHead className="w-32 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground/70 pr-8">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-muted/20">
                    <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-16 rounded-xl" /></TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8 mx-auto rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-20 ml-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        <div className="relative bg-muted/20 p-8 rounded-full border border-muted/50">
                          <Plus className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-foreground/80">Chưa có danh mục nào</h3>
                        <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                          Bắt đầu tạo danh mục đầu tiên để phân loại và trưng bày sản phẩm trên cửa hàng.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleOpenCreate}
                        className="rounded-xl px-8 shadow-sm hover:shadow-md transition-all font-bold"
                      >
                        Thiết lập ngay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories
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
                        'group transition-all border-muted/20 hover:bg-primary/[0.02]',
                        dragId === cat.id && 'opacity-50 bg-muted/80 scale-[0.99] border-primary/50 border-y-2',
                      )}
                    >
                      {/* Drag Handle */}
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors cursor-grab active:cursor-grabbing" />
                        </div>
                      </TableCell>
                      
                      {/* Image */}
                      <TableCell>
                        <div className="relative h-12 w-16 rounded-xl overflow-hidden border border-muted bg-muted ring-offset-background group-hover:ring-2 group-hover:ring-primary/20 transition-all shadow-sm">
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
                              <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[250px] opacity-70">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Slug */}
                      <TableCell>
                        <code className="text-[10px] font-mono bg-muted/50 px-2 py-1 rounded-md text-muted-foreground border border-muted/50 group-hover:border-primary/20 group-hover:text-primary transition-all">
                          {cat.slug}
                        </code>
                      </TableCell>

                      {/* Product Count */}
                      <TableCell className="text-center">
                        <Badge 
                          variant={cat.productCount ? 'default' : 'secondary'} 
                          className={cn(
                            'rounded-lg px-2 h-6 font-bold shadow-sm',
                            cat.productCount ? 'bg-primary border-none text-primary-foreground' : 'bg-muted/50 text-muted-foreground border-none'
                          )}
                        >
                          {cat.productCount ?? 0}
                        </Badge>
                      </TableCell>

                      {/* Sort Order */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-muted/30 border border-muted/50 group-hover:border-primary/20 transition-all font-mono text-xs font-bold text-muted-foreground group-hover:text-primary">
                          {cat.sortOrder}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-xl hover:bg-background shadow-none hover:shadow-lg hover:text-primary border hover:border-primary/10 transition-all"
                            onClick={() => handleOpenEdit(cat)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive shadow-none border hover:border-destructive/10 transition-all"
                            onClick={() => handleOpenDelete(cat)}
                          >
                            <Trash2 className="h-4 w-4" />
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
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-muted/50 bg-muted/20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shadow-inner">
          <GripVertical className="h-3 w-3" />
          Mẹo: Kéo thả các dòng để sắp xếp thứ tự hiển thị ưu tiên
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
