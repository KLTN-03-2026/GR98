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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mã Lô" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <QrCode className="size-4 text-muted-foreground" />
            <span className="font-mono text-xs font-medium uppercase text-slate-500">
              {row.original.id.slice(-8)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'product',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sản phẩm" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {row.original.product.name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase px-1 bg-slate-100 rounded">
                {row.original.product.sku}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "h-4 rounded px-1.5 py-0 text-[9px] font-bold border-none",
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kho lưu trữ" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.warehouse.name}
          </span>
        ),
      },
      {
        accessorKey: 'quantityKg',
        header: ({ column }) => (
          <div className="text-right w-full">
            <DataTableColumnHeader column={column} title="Số lượng" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            <span className="text-sm font-bold">
              {row.original.quantityKg.toLocaleString('vi-VN')}
            </span>
            <span className="ml-1 text-[10px] text-muted-foreground font-medium uppercase">
              {row.original.product.unit}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Hạn sử dụng" />,
        cell: ({ row }) => {
          if (!row.original.expiryDate) return <span className="text-xs text-muted-foreground italic">N/A</span>;
          
          const expiryDate = new Date(row.original.expiryDate);
          const daysLeft = differenceInDays(expiryDate, new Date());
          const isExpired = isPast(expiryDate);
          
          return (
            <div className="flex flex-col gap-0.5">
              <span className={cn(
                "text-xs font-semibold",
                isExpired ? "text-rose-600" : daysLeft < 7 ? "text-amber-600" : "text-slate-600"
              )}>
                {format(expiryDate, 'dd/MM/yyyy')}
              </span>
              <div className="flex items-center gap-1">
                {isExpired ? (
                  <Badge variant="destructive" className="h-3.5 px-1 text-[8px] font-bold uppercase">Quá hạn</Badge>
                ) : daysLeft < 7 ? (
                  <Badge className="h-3.5 px-1 bg-amber-100 text-amber-700 border-none text-[8px] font-bold uppercase">Sắp hết ({daysLeft}n)</Badge>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end">
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
