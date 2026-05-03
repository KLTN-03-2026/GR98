import { useState } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpenCheck, Star, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useInternalReviews, useUpdateReviewStatus, useDeleteReview } from '@/client/api/reviews';
import type { Review } from '@/client/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ReviewsAdminPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data, isLoading } = useInternalReviews({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 100
  });
  
  const reviews = data?.items ?? [];
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
            className={`size-3 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-2 py-0.5 uppercase tracking-wider">Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-500/10 text-rose-600 border-none text-[10px] px-2 py-0.5 uppercase tracking-wider">Từ chối</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 border-none text-[10px] px-2 py-0.5 uppercase tracking-wider">Chờ duyệt</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50/50">
      <Card className="rounded-[2rem] border-slate-100 shadow-sm bg-white/50 backdrop-blur-xl flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                <BookOpenCheck className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Quản lý đánh giá
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Duyệt và phản hồi đánh giá của khách hàng về sản phẩm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
              <Input
                placeholder="Tìm kiếm đánh giá..."
                className="h-9 rounded-full border-slate-200 pl-9 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9 rounded-full border-slate-200">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* Table Section */}
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <div className="h-full overflow-auto rounded-2xl border border-slate-100 bg-white shadow-xs custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-b-slate-100 hover:bg-transparent">
                  <TableHead className="w-[200px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Sản phẩm</TableHead>
                  <TableHead className="w-[200px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Khách hàng</TableHead>
                  <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Đánh giá</TableHead>
                  <TableHead className="min-w-[250px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Nội dung</TableHead>
                  <TableHead className="w-[120px] text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</TableHead>
                  <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Ngày tạo</TableHead>
                  <TableHead className="w-[120px] text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b-slate-50">
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <BookOpenCheck className="size-10 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Không tìm thấy đánh giá nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review: any) => (
                    <TableRow key={review.id} className="border-b-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {review.product?.thumbnailUrl ? (
                            <img src={review.product.thumbnailUrl} alt="" className="size-8 rounded-md object-cover bg-slate-100" />
                          ) : (
                            <div className="size-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">SP</div>
                          )}
                          <span className="text-sm font-semibold text-slate-700 line-clamp-1">{review.product?.name || 'Sản phẩm đã xóa'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-600 line-clamp-1">
                          {review.client?.user?.fullName || 'Khách vãng lai'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {renderStars(review.rating)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-md">
                          {review.comment || <span className="italic text-slate-400">Không có bình luận</span>}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderStatus(review.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {format(new Date(review.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          {review.status !== 'APPROVED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(review.id)}
                              className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Duyệt"
                            >
                              <CheckCircle className="size-4" />
                            </Button>
                          )}
                          {review.status !== 'REJECTED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReject(review.id)}
                              className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              title="Từ chối"
                            >
                              <XCircle className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(review.id)}
                            className="size-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Xóa"
                          >
                            <Trash2 className="size-4" />
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
      </Card>
    </div>
  );
}
