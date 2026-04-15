import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  MapPin,
  Box,
  Info,
  History,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetLots } from './api';
import { useGetWarehouses } from '../warehouses/api';
import { format } from 'date-fns';
import CreateLotModal from './components/CreateLotModal';
import TraceabilityView from './components/TraceabilityView';

export default function InventoryLotsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch data
  const { data: lots, isLoading } = useGetLots({
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    qualityGrade: gradeFilter !== 'all' ? gradeFilter : undefined,
  });

  const { data: warehouses } = useGetWarehouses();

  // Filter local search by Product Name or SKU
  const filteredLots = useMemo(() => {
    if (!lots) return [];
    if (!searchQuery) return lots;
    
    const query = searchQuery.toLowerCase();
    return lots.filter(
      (lot) =>
        lot.product.name.toLowerCase().includes(query) ||
        lot.product.sku.toLowerCase().includes(query)
    );
  }, [lots, searchQuery]);

  const handleOpenTrace = (id: string) => {
    setSelectedLotId(id);
    setIsTraceOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col gap-8 p-4 md:p-8 font-manrope">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-white p-8 shadow-sm border border-primary/5">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 size-64 rounded-full bg-secondary/10 blur-3xl" />
        
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Box className="size-6" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                Quản lý Lô hàng
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Đang tải dữ liệu...' : `Tổng cộng ${lots?.length ?? 0} lô hàng trong hệ thống`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-10 gap-2 rounded-xl bg-primary shadow-md transition-all hover:shadow-lg active:scale-95"
            >
              <Plus className="size-4" />
              <span>Nhập kho mới</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <Card className="rounded-[28px] border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm sản phẩm, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-xl pl-10 border-primary/10 focus-visible:ring-primary/20"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-background p-1 border border-primary/5 shadow-sm">
                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger className="h-8 w-[160px] border-none bg-transparent font-medium shadow-none focus:ring-0">
                    <SelectValue placeholder="Tất cả kho" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/10">
                    <SelectItem value="all">Tất cả kho</SelectItem>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-muted mx-1" />
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="h-8 w-[130px] border-none bg-transparent font-medium shadow-none focus:ring-0">
                    <SelectValue placeholder="Chất lượng" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/10">
                    <SelectItem value="all">Mọi loại</SelectItem>
                    <SelectItem value="A">Hạng A</SelectItem>
                    <SelectItem value="B">Hạng B</SelectItem>
                    <SelectItem value="C">Hạng C</SelectItem>
                    <SelectItem value="REJECT">Loại bỏ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-primary/5 bg-white shadow-inner">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-primary/5">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Lô hàng & SKU</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Kho hàng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Số lượng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Chất lượng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Ngày nhập</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy lô hàng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLots.map((lot) => (
                    <TableRow key={lot.id} className="group border-primary/5 hover:bg-primary/[0.02] transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {lot.product.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{lot.product.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <MapPin className="size-3 text-muted-foreground" />
                          {lot.warehouse.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-sm">
                          {lot.quantityKg.toLocaleString()} {lot.product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`
                            rounded-lg px-2 py-0 text-[10px] font-bold border-none
                            ${lot.qualityGrade === 'A' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${lot.qualityGrade === 'B' ? 'bg-amber-100 text-amber-700' : ''}
                            ${lot.qualityGrade === 'C' ? 'bg-orange-100 text-orange-700' : ''}
                            ${lot.qualityGrade === 'REJECT' ? 'bg-rose-100 text-rose-700' : ''}
                          `}
                        >
                          Hạng {lot.qualityGrade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {format(new Date(lot.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0 rounded-lg group-hover:bg-white shadow-none">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-primary/10">
                            <DropdownMenuItem 
                              onClick={() => handleOpenTrace(lot.id)}
                              className="gap-2 cursor-pointer"
                            >
                              <History className="size-4" />
                              <span>Truy xuất nguồn gốc</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                              <Info className="size-4" />
                              <span>Chi tiết lô hàng</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
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
    </div>
  );
}
