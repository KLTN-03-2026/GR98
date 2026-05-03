import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpenCheck, Star, Trash2, CheckCircle, XCircle, MoreVertical, RefreshCw, X } from 'lucide-react';
import { useInternalReviews, useUpdateReviewStatus, useDeleteReview } from '@/client/api/reviews';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DataTable } from '@/components/data-table';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ReviewsAdminPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  
  const { data, isLoading, isFetching, refetch } = useInternalReviews({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit
  });
  
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const updateStatus = useUpdateReviewStatus();
  const deleteReview = useDeleteReview();

  const handleApprove = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'APPROVED' });
  };

  const handleReject = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'REJECTED' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      await deleteReview.mutateAsync(id);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
                "size-3",
                star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
            )}
          />
        ))}
      </div>
    );
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden shrink-0">
            {row.original.product?.thumbnailUrl ? (
                <img src={row.original.product.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">SP</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">
                {row.original.product?.name || 'Sản phẩm không khả dụng'}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                {row.original.product?.category || 'Chưa phân loại'}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'client',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-700">
                {row.original.client?.user?.fullName || 'Khách vãng lai'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
                {row.original.client?.user?.phone || 'N/A'}
            </p>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Đánh giá',
      cell: ({ row }) => (
        <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900">{row.original.rating}/5</span>
            {renderStars(row.original.rating)}
        </div>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Nội dung',
      cell: ({ row }) => (
        <div className="max-w-[300px]">
            <p className="text-sm text-slate-600 line-clamp-2 italic leading-relaxed">
                {row.original.comment ? `"${row.original.comment}"` : <span className="text-slate-300">Không có bình luận</span>}
            </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center w-full">Trạng thái</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        const variants: Record<string, string> = {
            APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
            PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
        };
        const labels: Record<string, string> = {
            APPROVED: 'Đã duyệt',
            REJECTED: 'Từ chối',
            PENDING: 'Chờ duyệt',
        };
        return (
            <div className="flex justify-center">
                <Badge variant="outline" className={cn("rounded-lg font-bold uppercase text-[9px] tracking-widest px-2 py-0.5 shadow-none border-transparent", variants[status] || 'bg-slate-50 text-slate-500')}>
                    {labels[status] || status}
                </Badge>
            </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-500 tabular-nums">
            {format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0 rounded-lg hover:bg-slate-100">
                        <MoreVertical className="size-4 text-slate-400" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-xl p-1">
                    {row.original.status !== 'APPROVED' && (
                        <DropdownMenuItem onClick={() => handleApprove(row.original.id)} className="gap-2.5 cursor-pointer rounded-lg py-2 font-semibold text-xs">
                            <CheckCircle className="size-4 text-emerald-600" />
                            <span>Phê duyệt đánh giá</span>
                        </DropdownMenuItem>
                    )}
                    {row.original.status !== 'REJECTED' && (
                        <DropdownMenuItem onClick={() => handleReject(row.original.id)} className="gap-2.5 cursor-pointer rounded-lg py-2 font-semibold text-xs">
                            <XCircle className="size-4 text-amber-600" />
                            <span>Từ chối đánh giá</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="gap-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-lg py-2 font-semibold text-xs">
                        <Trash2 className="size-4" />
                        <span>Xóa vĩnh viễn</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const filterToolbar = (
    <div className="flex flex-wrap items-end gap-4 w-full">
      <div className="space-y-1.5 min-w-[240px] flex-1 max-w-sm">
        <Label className="text-xs font-medium">Tìm kiếm đánh giá</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo nội dung, sản phẩm..."
            className="pl-8 h-9 rounded-md text-sm border-slate-200 focus:border-primary/30"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="space-y-1.5 min-w-[160px]">
        <Label className="text-xs font-medium">Trạng thái phê duyệt</Label>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 rounded-md text-xs border-slate-200">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(search || statusFilter !== 'all') && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs text-muted-foreground hover:text-rose-600"
          onClick={() => {
            setSearch('');
            setStatusFilter('all');
            setPage(1);
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Xóa lọc
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-manrope animate-in fade-in duration-500">
      {/* Header Section - Admin Style */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary shadow-sm">
                    <BookOpenCheck className="size-5" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Quản lý Đánh giá
                </h1>
            </div>
            <p className="text-sm text-muted-foreground">
                Kiểm duyệt và phản hồi các đánh giá của khách hàng về chất lượng sản phẩm.
            </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl border-slate-200"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4 text-slate-400", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading || isFetching}
            onReload={() => refetch()}
            hiddenSearch
            enableSorting={false}
            manualPagination
            pageCount={totalPages}
            totalItems={total}
            onPaginationChange={(updater) => {
                const next = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;
                setPage(next.pageIndex + 1);
                setLimit(next.pageSize);
            }}
            state={{ pagination: { pageIndex: page - 1, pageSize: limit } }}
            pageSizeOptions={[10, 15, 20, 30, 50]}
            filterToolbar={filterToolbar}
            noResults={<span className="text-muted-foreground">Không tìm thấy đánh giá nào phù hợp.</span>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
