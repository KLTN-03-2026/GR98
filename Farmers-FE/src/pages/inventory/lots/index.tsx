import { useMemo, useState } from 'react';
import {
  Plus,
  Box,
  History,
  MoreVertical,
  RefreshCcw,
  QrCode,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useGetLots } from './api';
import { useGetWarehouses } from '../warehouses/api';
import { format, differenceInDays, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import CreateLotModal from './components/CreateLotModal';
import TraceabilityView from './components/TraceabilityView';
import UpdateGradeModal from './components/UpdateGradeModal';
import type { InventoryLot } from './api/types';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { ColumnDef } from '@tanstack/react-table';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function InventoryLotsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [lotToUpdate, setLotToUpdate] = useState<InventoryLot | null>(null);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateGradeOpen, setIsUpdateGradeOpen] = useState(false);

  const { data: lots, isLoading, isRefetching, refetch } = useGetLots({
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    qualityGrade: gradeFilter !== 'all' ? gradeFilter : undefined,
  });

  const { data: warehouses } = useGetWarehouses();

  const handleOpenTrace = (id: string) => {
    setSelectedLotId(id);
    setIsTraceOpen(true);
  };

  const handleOpenUpdateGrade = (lot: InventoryLot) => {
    setLotToUpdate(lot);
    setIsUpdateGradeOpen(true);
  };

  const columns = useMemo<ColumnDef<InventoryLot>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <div className="flex items-center justify-center w-full h-full"><DataTableColumnHeader column={column} title="Mã Lô" /></div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2 w-[80px] mx-auto h-full">
            <QrCode className="size-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-xs font-medium uppercase text-slate-500 truncate">
              {row.original.id.slice(-8)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'product',
        header: ({ column }) => <div className="flex items-center justify-center w-full h-full"><DataTableColumnHeader column={column} title="Sản phẩm" /></div>,
        cell: ({ row }) => (
          <div className="flex flex-col items-center justify-center min-h-[44px] min-w-[160px] max-w-[220px] mx-auto text-center h-full">
            <span className="font-semibold text-sm truncate w-full">
              {row.original.product.name}
            </span>
            <div className="flex items-center justify-center gap-2 mt-0.5 w-full">
              <span className="text-[10px] text-muted-foreground font-medium uppercase px-1.5 py-0.5 bg-slate-100 rounded leading-none shrink-0">
                {row.original.product.sku}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "h-[18px] rounded px-1.5 py-0 text-[9px] font-bold border-none shrink-0",
                  row.original.qualityGrade === 'A' ? 'bg-emerald-50 text-emerald-700' : 
                  row.original.qualityGrade === 'B' ? 'bg-amber-50 text-amber-700' : 
                  row.original.qualityGrade === 'C' ? 'bg-orange-50 text-orange-700' : 
                  'bg-rose-50 text-rose-700'
                )}
              >
                HẠNG {row.original.qualityGrade}
              </Badge>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'warehouse',
        header: ({ column }) => <div className="flex items-center justify-center w-full h-full"><DataTableColumnHeader column={column} title="Kho lưu trữ" /></div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-[120px] max-w-[160px] mx-auto text-center h-full">
            <span className="text-sm font-medium truncate">
              {row.original.warehouse.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'quantityKg',
        header: ({ column }) => (
          <div className="flex items-center justify-center w-full h-full">
            <DataTableColumnHeader column={column} title="Số lượng" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center tabular-nums w-[110px] mx-auto h-full">
            <span className="text-sm font-bold truncate">
              {row.original.quantityKg.toLocaleString('vi-VN')}
            </span>
            <span className="ml-1 text-[10px] text-muted-foreground font-medium uppercase inline-block text-left shrink-0">
              {row.original.product.unit || 'kg'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: ({ column }) => <div className="flex items-center justify-center w-full h-full"><DataTableColumnHeader column={column} title="Hạn sử dụng" /></div>,
        cell: ({ row }) => {
          if (!row.original.expiryDate) {
            return (
              <div className="flex flex-col items-center justify-center min-h-[44px] w-[100px] mx-auto h-full">
                <span className="text-xs text-muted-foreground italic">N/A</span>
              </div>
            );
          }
          
          const expiryDate = new Date(row.original.expiryDate);
          const daysLeft = differenceInDays(expiryDate, new Date());
          const isExpired = isPast(expiryDate);
          
          return (
            <div className="flex flex-col items-center justify-center min-h-[44px] w-[100px] mx-auto text-center h-full">
              <span className={cn(
                "text-xs font-semibold truncate",
                isExpired ? "text-rose-600" : daysLeft < 7 ? "text-amber-600" : "text-slate-600"
              )}>
                {format(expiryDate, 'dd/MM/yyyy')}
              </span>
              {(isExpired || daysLeft < 7) && (
                <div className="flex items-center justify-center mt-0.5">
                  {isExpired ? (
                    <Badge variant="destructive" className="h-[18px] px-1.5 text-[8px] font-bold uppercase border-none shrink-0">Quá hạn</Badge>
                  ) : (
                    <Badge className="h-[18px] px-1.5 bg-amber-100 text-amber-700 border-none text-[8px] font-bold uppercase shrink-0">Sắp hết ({daysLeft}n)</Badge>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-[40px] mx-auto h-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenTrace(row.original.id)} className="gap-2">
                  <ExternalLink className="size-4" /> Chi tiết & Truy xuất
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <History className="size-4" /> Nhật ký giao dịch
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleOpenUpdateGrade(row.original)} className="gap-2">
                  <RefreshCcw className="size-4" /> Điều chỉnh phẩm cấp
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <QrCode className="size-4" /> In tem nhãn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-4 md:p-6 font-manrope">
      {/* Header Section - Admin Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
              <Box className="size-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Quản lý lô hàng</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Theo dõi tồn kho thực tế theo từng lô nhập, truy xuất nguồn gốc nông dân và quản lý chất lượng.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="size-4 mr-2" />
          Nhập kho mới
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={lots ?? []}
            isLoading={isLoading}
            onReload={() => refetch()}
            noResults={
              <span className="text-muted-foreground">Không tìm thấy lô hàng phù hợp.</span>
            }
            filterToolbar={
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2 min-w-[180px]">
                  <Label className="text-xs">Kho hàng</Label>
                  <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tất cả kho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả kho</SelectItem>
                      {warehouses?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-[140px]">
                  <Label className="text-xs">Phẩm cấp</Label>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Mọi hạng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="A">Hạng A</SelectItem>
                      <SelectItem value="B">Hạng B</SelectItem>
                      <SelectItem value="C">Hạng C</SelectItem>
                      <SelectItem value="REJECT">Loại bỏ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isRefetching && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
                    <RefreshCcw className="size-3 animate-spin" />
                    Đang cập nhật...
                  </div>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      <CreateLotModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      <TraceabilityView 
        lotId={selectedLotId}
        isOpen={isTraceOpen}
        onClose={() => {
          setIsTraceOpen(false);
          setSelectedLotId(null);
        }}
      />

      <UpdateGradeModal
        lot={lotToUpdate}
        isOpen={isUpdateGradeOpen}
        onClose={() => {
          setIsUpdateGradeOpen(false);
          setLotToUpdate(null);
        }}
      />
    </div>
  );
}
