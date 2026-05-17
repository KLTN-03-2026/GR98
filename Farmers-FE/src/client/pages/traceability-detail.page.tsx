import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Sprout,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  Warehouse,
  Star,
  TrendingUp,
  QrCode,
  User,
  Ruler,
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Leaf,
  ArrowDownToLine,
  ArrowUpFromLine,
  ScanLine,
  BadgeCheck,
  Tractor,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProductTraceability } from '@/client/api';
import { formatPrice } from '@/lib/utils';
import {
  GRADE_LABELS,
  CROP_TYPES,
  type TraceTimelineItem,
  type TraceInventoryLot,
  type TraceReview,
} from '@/client/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const REPORT_TYPE_LABELS: Record<string, string> = {
  ROUTINE: 'Báo cáo định kỳ',
  INCIDENT: 'Sự cố',
  HARVEST: 'Thu hoạch',
};

const TIMELINE_STYLES: Record<
  string,
  { label: string; color: string; bg: string; ring: string; Icon: typeof Sprout }
> = {
  planting: {
    label: 'Gieo trồng',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    Icon: Sprout,
  },
  expected_harvest: {
    label: 'Dự kiến',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    ring: 'ring-amber-200 dark:ring-amber-800',
    Icon: Calendar,
  },
  report: {
    label: 'Định kỳ',
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    ring: 'ring-sky-200 dark:ring-sky-800',
    Icon: FileText,
  },
  incident: {
    label: 'Sự cố',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
    ring: 'ring-red-200 dark:ring-red-800',
    Icon: AlertTriangle,
  },
  harvest: {
    label: 'Thu hoạch',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    ring: 'ring-orange-200 dark:ring-orange-800',
    Icon: Package,
  },
  scan: {
    label: 'Phát hiện',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    ring: 'ring-rose-200 dark:ring-rose-800',
    Icon: ScanLine,
  },
  warehouse: {
    label: 'Nhập kho',
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
    ring: 'ring-indigo-200 dark:ring-indigo-800',
    Icon: ArrowDownToLine,
  },
  transaction: {
    label: 'Giao dịch',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    ring: 'ring-purple-200 dark:ring-purple-800',
    Icon: ArrowUpFromLine,
  },
};

function getTimelineStyle(type: string) {
  return TIMELINE_STYLES[type] ?? TIMELINE_STYLES.report;
}

function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Gộp inventory lots theo (harvestDate quy về YYYY-MM-DD) + qualityGrade.
 * Để FE hiển thị "Đợt thu hoạch ngày X — Hạng Y" thay vì liệt kê từng lot
 * (mỗi lot = 1 dòng InventoryLot trong DB). Ẩn warehouse và số kg để bảo vệ
 * dữ liệu vận hành.
 */
function groupLotsByHarvestAndGrade(lots: TraceInventoryLot[]) {
  const map = new Map<
    string,
    { key: string; harvestDate: string | null; qualityGrade: string }
  >();
  for (const lot of lots) {
    const dayKey = lot.harvestDate
      ? new Date(lot.harvestDate).toISOString().slice(0, 10)
      : 'unknown';
    const key = `${dayKey}::${lot.qualityGrade}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        harvestDate: lot.harvestDate ?? null,
        qualityGrade: lot.qualityGrade,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (!a.harvestDate) return 1;
    if (!b.harvestDate) return -1;
    return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
  });
}

export default function TraceabilityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useProductTraceability(slug ?? '');

  if (isLoading) return <TraceabilityDetailSkeleton />;

  if (!data) {
    return (
      <div className="container mx-auto px-4 pt-[120px] pb-24 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy dữ liệu</h2>
        <p className="text-muted-foreground mb-6">
          Sản phẩm này chưa có thông tin truy xuất nguồn gốc.
        </p>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link to="/traceability">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  const { product, plot, contract, timeline, contributingPlots, inventoryLots, reviews, stats } = data;

  const yieldData = stats.yieldHistory.map((y: { date: string; value: number }) => ({
    date: new Date(y.date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }),
    value: Math.round(y.value),
  }));

  const reportTypeData = Object.entries(stats.reportTypeCounts).map(([key, value]) => ({
    name: REPORT_TYPE_LABELS[key] ?? key,
    value,
  }));

  const scanCategoryData = Object.entries(stats.scanCategoryCounts).map(([key, value]) => ({
    name: key,
    value,
  }));

  const heroBg = product.thumbnailUrl || product.imageUrls?.[0];
  const cropTypeLabel =
    CROP_TYPES[product.cropType as keyof typeof CROP_TYPES] ?? product.cropType;

  // Multi-farm: nếu có nhiều plots đóng góp, hiển thị số lượng nông dân
  const allPlots: any[] = contributingPlots ?? (plot ? [plot] : []);
  const farmCount = allPlots.length;
  const farmerName = farmCount > 1
    ? `${farmCount} nông trại`
    : (plot?.farmer?.fullName ?? contract?.farmer?.fullName ?? 'Chưa xác định');

  // Card "Người canh tác → Giám sát viên" hiển thị NGƯỜI ĐANG PHỤ TRÁCH plot
  // (Assignment ACTIVE) — có thể khác với người ký hợp đồng nếu plot đã được
  // bàn giao. Fallback về contract.supervisor (signer) khi BE chưa kịp trả
  // currentSupervisor.
  const supervisorName =
    (plot as any)?.currentSupervisor?.fullName ??
    contract?.supervisor?.fullName ??
    null;
  const locationLabel = plot?.zone
    ? [plot.zone.district, plot.zone.province].filter(Boolean).join(', ') ||
      plot.zone.name
    : plot?.farmer?.province ?? 'Chưa xác định';

  return (
    <div className="bg-background pb-20">
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden pt-[78px]">
        {/* Background blur */}
        {heroBg && (
          <div className="absolute inset-0 -z-10">
            <img
              src={heroBg}
              alt=""
              className="w-full h-full object-cover scale-110 blur-2xl opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>
        )}
        {!heroBg && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-background to-background dark:from-emerald-950/30" />
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/traceability" className="hover:text-primary transition-colors">
              Truy xuất nguồn gốc
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate max-w-[200px] sm:max-w-none">
              {product.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Product image card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-muted/30 border shadow-xl shadow-emerald-900/5">
                {heroBg ? (
                  <img
                    src={heroBg}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                    <Package className="h-20 w-20" />
                    <span className="text-sm">Chưa có hình ảnh</span>
                  </div>
                )}
                {/* Verified stamp */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold shadow-lg">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Đã xác thực
                </div>
                {/* Grade badge */}
                <div className="absolute top-4 right-4 inline-flex items-center rounded-full bg-amber-500 text-white px-3 py-1.5 text-xs font-bold shadow-lg">
                  {GRADE_LABELS[product.grade as keyof typeof GRADE_LABELS] ?? `Hạng ${product.grade}`}
                </div>
              </div>
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3 space-y-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Leaf className="h-3 w-3 text-emerald-600" />
                  {cropTypeLabel}
                </Badge>
                {product.variety && (
                  <Badge variant="outline">{product.variety}</Badge>
                )}
                {product.categories?.slice(0, 2).map((c: { id: string; name: string }) => (
                  <Badge key={c.id} variant="outline" className="bg-background/60">
                    {c.name}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Quick facts grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <QuickFact
                  icon={<Tractor className="h-4 w-4" />}
                  label="Nông dân"
                  value={farmerName}
                />
                <QuickFact
                  icon={<MapPin className="h-4 w-4" />}
                  label="Vùng trồng"
                  value={locationLabel}
                />
                <QuickFact
                  icon={<Calendar className="h-4 w-4" />}
                  label="Thu hoạch"
                  value={
                    product.harvestDate
                      ? formatDate(product.harvestDate)
                      : 'Chưa thu hoạch'
                  }
                />
              </div>

              {/* Trust bar */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                      Mã truy xuất xác thực
                    </p>
                    <p className="text-sm font-mono font-semibold text-emerald-900 dark:text-emerald-300 truncate">
                      {contract?.traceabilityQr ?? product.qrCode ?? product.sku}
                    </p>
                  </div>
                </div>
                {contract?.contractNo && (
                  <>
                    <div className="hidden sm:block w-px bg-emerald-200 dark:bg-emerald-800/60" />
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                          Hợp đồng
                        </p>
                        <p className="text-sm font-mono font-semibold text-emerald-900 dark:text-emerald-300">
                          {contract.contractNo}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Price + rating */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(product.pricePerKg)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {product.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= Math.round(product.averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {product.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount})
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to={`/products/${product.slug}`}>
                    <Package className="h-4 w-4" />
                    Xem sản phẩm
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl">
                  <Link to="/traceability">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Tất cả
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            tone="emerald"
            icon={<FileText className="h-5 w-5" />}
            label="Báo cáo đồng ruộng"
            value={stats.totalReports}
            sub={`${stats.totalHarvestReports} báo cáo thu hoạch`}
          />
          <StatCard
            tone="rose"
            icon={<ScanLine className="h-5 w-5" />}
            label="Quét sâu bệnh"
            value={stats.totalScans}
            sub={`${stats.totalIncidents} sự cố ghi nhận`}
          />
          {/* Stat: số đợt thu hoạch đã qua kiểm định + nhập kho. Thay cho ô
              "Tổng sản lượng kho" cũ — ẩn số kg để bảo vệ dữ liệu vận hành,
              vẫn cho khách biết quy mô sản xuất ở mức không nhạy cảm. */}
          <StatCard
            tone="indigo"
            icon={<Package className="h-5 w-5" />}
            label="Đợt thu hoạch"
            value={groupLotsByHarvestAndGrade(inventoryLots).length}
            sub="đã qua kiểm định"
          />
          {stats.contributingFarmCount > 1 ? (
            <StatCard
              tone="amber"
              icon={<Tractor className="h-5 w-5" />}
              label="Nông trại đóng góp"
              value={stats.contributingFarmCount}
              sub="cùng vùng địa lý"
            />
          ) : (
            <StatCard
              tone="amber"
              icon={<TrendingUp className="h-5 w-5" />}
              label="Năng suất ước tính"
              value={`${stats.avgYieldEstimate.toFixed(0)}`}
              sub="kg trung bình / báo cáo"
            />
          )}
        </motion.div>
      </section>

      {/* ========== TABS ========== */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Tabs defaultValue="timeline" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="h-auto rounded-full p-1 bg-muted/60">
              <TabsTrigger value="timeline" className="rounded-full px-5 py-2 text-sm gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Hành trình
              </TabsTrigger>
              <TabsTrigger value="farm" className="rounded-full px-5 py-2 text-sm gap-1.5">
                <Tractor className="h-3.5 w-3.5" />
                Nông trại
              </TabsTrigger>
              <TabsTrigger value="quality" className="rounded-full px-5 py-2 text-sm gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Chất lượng
              </TabsTrigger>
              <TabsTrigger value="insights" className="rounded-full px-5 py-2 text-sm gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Phân tích
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-full px-5 py-2 text-sm gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Đánh giá
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ----- Timeline tab ----- */}
          <TabsContent value="timeline" className="mt-6">
            <Card className="rounded-2xl border-muted/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Hành trình của sản phẩm
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Toàn bộ sự kiện từ lúc gieo trồng đến khi đến tay khách hàng.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  const publicTimeline = sanitizePublicTimeline(timeline);
                  if (publicTimeline.length === 0) {
                    return <EmptyState text="Chưa có sự kiện nào." />;
                  }
                  return (
                    <ol className="relative space-y-3 pl-9 sm:pl-12">
                      <span
                        aria-hidden
                        className="absolute left-[14px] sm:left-[18px] top-3 bottom-3 w-px bg-gradient-to-b from-emerald-300/70 via-border to-emerald-200/30"
                      />
                      {publicTimeline.map((item, idx) => {
                        const style = getTimelineStyle(item.type);
                        const Icon = style.Icon;
                        return (
                          <li key={idx} className="relative">
                            {/* Marker */}
                            <span
                              className={`absolute -left-9 sm:-left-12 top-2.5 flex h-7 w-7 items-center justify-center rounded-full ring-2 ${style.bg} ${style.ring} ${style.color}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="rounded-lg border bg-card px-3.5 py-2.5 hover:shadow-sm transition-shadow">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className={`text-[11px] font-semibold uppercase tracking-wide ${style.color}`}>
                                  {style.label}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDateTime(item.date)}
                                </span>
                              </div>
                              <h4 className="mt-0.5 text-sm font-semibold leading-snug">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              {/* Source tag — hiển thị khi sản phẩm gộp nhiều nông trại */}
                              {item.source && (item.source.plotCode || item.source.farmerName) && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {item.source.plotCode && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {item.source.plotCode}
                                    </span>
                                  )}
                                  {item.source.farmerName && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      <User className="h-2.5 w-2.5" />
                                      {item.source.farmerName}
                                    </span>
                                  )}
                                </div>
                              )}
                              {item.imageUrls && item.imageUrls.length > 0 && (
                                <div className="mt-2 flex gap-1.5 overflow-x-auto">
                                  {item.imageUrls.slice(0, 4).map((url: string, i: number) => (
                                    <img
                                      key={i}
                                      src={url}
                                      alt=""
                                      className="h-16 w-16 object-cover rounded-md border shrink-0"
                                    />
                                  ))}
                                </div>
                              )}
                              {item.meta && Object.keys(item.meta).length > 0 && (
                                <TimelineMeta meta={item.meta} />
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----- Farm tab ----- */}
          <TabsContent value="farm" className="mt-6 space-y-6">

            {/* Multi-farm banner — hiện khi sản phẩm gộp từ nhiều nông trại */}
            {farmCount > 1 && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 px-4 py-3">
                <Sprout className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Sản phẩm từ {farmCount} nông trại
                  </p>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 mt-0.5">
                    Cùng vùng địa lý, cùng giống cây và phẩm cấp — được gộp chung để đảm bảo tính đồng nhất.
                  </p>
                </div>
              </div>
            )}

            {/* Danh sách tất cả plots đóng góp — chỉ hiển thị thông tin
                cần thiết cho khách hàng (nguồn gốc, người canh tác).
                Mã lô, diện tích, mã hợp đồng… là dữ liệu nội bộ, ẩn đi. */}
            {farmCount > 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPlots.map((p: any, idx: number) => (
                  <Card key={p.id ?? idx} className="rounded-2xl">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          Đã xác thực
                        </Badge>
                      </div>
                      {p.farmer?.fullName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-medium text-foreground">
                            {p.farmer.fullName}
                          </span>
                        </div>
                      )}
                      {(p.zone || p.farmer?.province) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {p.zone
                            ? [p.zone.district, p.zone.province]
                                .filter(Boolean)
                                .join(', ') || p.zone.name
                            : p.farmer?.province}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plot info */}
              <Card className="rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-primary" />
                    Lô đất canh tác
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {plot ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoTile
                          icon={<MapPin />}
                          label="Mã lô"
                          value={plot.plotCode}
                          mono
                        />
                        <InfoTile
                          icon={<Ruler />}
                          label="Diện tích"
                          value={`${plot.areaHa} ha`}
                        />
                        <InfoTile
                          icon={<Calendar />}
                          label="Ngày gieo trồng"
                          value={
                            plot.plantingDate ? formatDate(plot.plantingDate) : '—'
                          }
                        />
                        <InfoTile
                          icon={<Calendar />}
                          label="Dự kiến thu hoạch"
                          value={
                            plot.expectedHarvest
                              ? formatDate(plot.expectedHarvest)
                              : '—'
                          }
                        />
                        {plot.estimatedYieldKg != null && (
                          <InfoTile
                            icon={<TrendingUp />}
                            label="Sản lượng dự kiến"
                            value={`${plot.estimatedYieldKg.toLocaleString('vi-VN')} kg`}
                          />
                        )}
                        {plot.zone && (
                          <InfoTile
                            icon={<Building2 />}
                            label="Vùng canh tác"
                            value={`${plot.zone.name}${plot.zone.district ? ` · ${plot.zone.district}` : ''}, ${plot.zone.province}`}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <EmptyState text="Chưa có thông tin lô đất." />
                  )}
                </CardContent>
              </Card>

              {/* People */}
              <Card className="rounded-2xl bg-gradient-to-br from-emerald-50 to-background dark:from-emerald-950/40">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Người canh tác
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <PersonRow
                    name={farmerName}
                    role="Nông dân phụ trách"
                    location={plot?.farmer?.province}
                    verified
                  />
                  {supervisorName && (
                    <PersonRow
                      name={supervisorName}
                      role="Giám sát viên"
                      verified
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            )} {/* end single-farm else */}
          </TabsContent>

          {/* ----- Quality tab ----- */}
          <TabsContent value="quality" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cam kết chất lượng — chỉ hiển thị thông tin khách hàng cần
                  (phân hạng cam kết, mã QR truy xuất). Số hợp đồng / ngày ký /
                  hạn thu hoạch là dữ liệu nội bộ giữa nông dân và nhà thu mua,
                  không show ra trang công khai. */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Cam kết chất lượng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoTile
                          icon={<BadgeCheck />}
                          label="Phân hạng cam kết"
                          value={
                            GRADE_LABELS[contract.grade as keyof typeof GRADE_LABELS] ??
                            `Hạng ${contract.grade}`
                          }
                        />
                        {farmCount > 1 && (
                          <InfoTile
                            icon={<Sprout />}
                            label="Số nông trại đối tác"
                            value={`${farmCount} nông trại`}
                          />
                        )}
                      </div>
                      {farmCount > 1 && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Sản phẩm này được gộp từ nhiều nông trại cùng đạt mức
                          cam kết chất lượng nêu trên. Xem tab “Nông trại” để
                          biết chi tiết từng đơn vị cung cấp.
                        </p>
                      )}
                      {(contract.traceabilityQr ?? product.qrCode) && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                          <QrCode className="h-5 w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Mã QR truy xuất
                            </p>
                            <p className="text-sm font-mono truncate">
                              {contract.traceabilityQr ?? product.qrCode}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState text="Chưa có cam kết chất lượng." />
                  )}
                </CardContent>
              </Card>

              {/* Product Identity */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Thông tin sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoTile icon={<QrCode />} label="Mã SKU" value={product.sku} mono />
                    <InfoTile
                      icon={<BadgeCheck />}
                      label="Phân hạng"
                      value={
                        GRADE_LABELS[product.grade as keyof typeof GRADE_LABELS] ??
                        product.grade
                      }
                    />
                    <InfoTile
                      icon={<Leaf />}
                      label="Loại nông sản"
                      value={cropTypeLabel}
                    />
                    {product.variety && (
                      <InfoTile
                        icon={<Sprout />}
                        label="Giống"
                        value={product.variety}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory */}
            {/* "Đợt thu hoạch & phân hạng" — gộp các lot có cùng ngày thu hoạch
                + phân hạng thành 1 thẻ. Ẩn warehouse name và số kg tồn hiện
                tại vì đó là dữ liệu vận hành nội bộ, không có giá trị cho
                khách hàng và có rủi ro lộ thông tin kinh doanh. Chỉ hiển thị
                ngày thu hoạch + phân hạng + dấu xác nhận "Đã nhập kho". */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-primary" />
                  Đợt thu hoạch & phân hạng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryLots.length === 0 ? (
                  <EmptyState text="Chưa có dữ liệu thu hoạch." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupLotsByHarvestAndGrade(inventoryLots).map((group) => (
                      <div
                        key={group.key}
                        className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400">
                            Hạng {group.qualityGrade}
                          </Badge>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                            Đợt thu hoạch
                          </p>
                          <p className="text-lg font-bold mt-0.5 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-primary" />
                            {group.harvestDate
                              ? formatDate(group.harvestDate)
                              : 'Chưa cập nhật'}
                          </p>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã qua kiểm định và nhập kho
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----- Insights tab ----- */}
          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Lịch sử ước tính năng suất
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {yieldData.length === 0 ? (
                    <EmptyState text="Chưa có dữ liệu năng suất." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={yieldData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid hsl(var(--border))',
                            background: 'hsl(var(--background))',
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#yieldGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Phân loại báo cáo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportTypeData.length === 0 ? (
                    <EmptyState text="Chưa có dữ liệu báo cáo." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={reportTypeData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {reportTypeData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid hsl(var(--border))',
                            background: 'hsl(var(--background))',
                            fontSize: 12,
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Phân loại sự cố sâu bệnh đã ghi nhận
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanCategoryData.length === 0 ? (
                    <EmptyState text="Chưa có dữ liệu sâu bệnh." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={scanCategoryData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid hsl(var(--border))',
                            background: 'hsl(var(--background))',
                            fontSize: 12,
                          }}
                          cursor={{ fill: 'hsl(var(--muted))' }}
                        />
                        <Bar dataKey="value" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ----- Reviews tab ----- */}
          <TabsContent value="reviews" className="mt-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Đánh giá từ khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <EmptyState text="Chưa có đánh giá nào cho sản phẩm này." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((review: TraceReview) => (
                      <div
                        key={review.id}
                        className="rounded-xl border bg-card p-5 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.clientAvatar ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {review.clientName?.charAt(0) ?? 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold truncate">
                                {review.clientName ?? 'Khách hàng'}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${
                                    s <= review.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function QuickFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-background/60 backdrop-blur border">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

const STAT_TONES = {
  emerald: {
    card: 'from-emerald-50 to-background dark:from-emerald-950/40',
    icon: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  rose: {
    card: 'from-rose-50 to-background dark:from-rose-950/30',
    icon: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  },
  indigo: {
    card: 'from-indigo-50 to-background dark:from-indigo-950/30',
    icon: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  },
  amber: {
    card: 'from-amber-50 to-background dark:from-amber-950/30',
    icon: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
} as const;

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  tone: keyof typeof STAT_TONES;
}) {
  const t = STAT_TONES[tone];
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${t.card} p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.icon}`}
        >
          {icon}
        </div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function PersonRow({
  name,
  role,
  location,
  verified,
}: {
  name: string;
  role: string;
  location?: string;
  verified?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur border">
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 font-semibold">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate">{name}</p>
          {verified && <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground">{role}</p>
        {location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {location}
          </p>
        )}
      </div>
    </div>
  );
}

function TimelineMeta({ meta }: { meta: Record<string, unknown> }) {
  // Lưu ý: timeline này hiển thị công khai (truy xuất nguồn gốc).
  // Cố ý KHÔNG render các trường nhạy cảm về kinh doanh:
  //   - yieldEstimateKg / quantityKg (sản lượng & khối lượng cụ thể)
  //   - mã đơn hàng / mã giao dịch (orderNo, transactionRef...)
  // Chỉ hiển thị các thông tin minh bạch nguồn gốc (vùng kho, phân hạng,
  // mức độ sự cố, biện pháp xử lý, người giám sát).
  const chips = useMemo(() => {
    const items: { label: string; tone?: 'default' | 'warning' | 'success' }[] = [];
    if (meta.dangerLevel)
      items.push({ label: `Mức độ: ${meta.dangerLevel}`, tone: 'warning' });
    if (meta.warehouseName) items.push({ label: `Kho: ${meta.warehouseName}` });
    if (meta.qualityGrade) items.push({ label: `Hạng ${meta.qualityGrade}` });
    if (meta.supervisorName) items.push({ label: `GS: ${meta.supervisorName}` });
    if (meta.treatment) items.push({ label: `Xử lý: ${meta.treatment}` });
    return items;
  }, [meta]);

  if (chips.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {chips.map((chip, i) => (
        <Badge
          key={i}
          variant="secondary"
          className={`text-[10px] font-normal px-1.5 py-0 h-5 ${
            chip.tone === 'warning'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : chip.tone === 'success'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : ''
          }`}
        >
          {chip.label}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Lọc & làm sạch timeline trước khi hiển thị công khai.
 * - Bỏ hoàn toàn các sự kiện `transaction` (giao dịch nhập/xuất nội bộ, bán online)
 *   vì chứa thông tin kinh doanh nhạy cảm (mã đơn EC-..., khối lượng cụ thể).
 * - Với sự kiện `warehouse` (Nhập kho): giữ mốc thời gian + tên kho, ẩn số liệu kg.
 * - Với sự kiện `harvest` (Thu hoạch): giữ mô tả vụ mùa, ẩn ước tính sản lượng.
 * - Các sự kiện khác (gieo trồng, báo cáo định kỳ, sự cố, quét bệnh) giữ nguyên
 *   — đây là phần minh bạch quy trình canh tác mà khách hàng cần thấy.
 */
function sanitizePublicTimeline(items: TraceTimelineItem[]): TraceTimelineItem[] {
  return items
    .filter((item) => item.type !== 'transaction')
    .map((item) => {
      if (item.type === 'warehouse') {
        const warehouseName = (item.meta?.warehouseName as string | undefined) ?? '';
        return {
          ...item,
          description: warehouseName
            ? `Sản phẩm đã được đưa vào kho lưu trữ tại ${warehouseName}.`
            : 'Sản phẩm đã được đưa vào kho lưu trữ.',
          // Giữ lại meta nhưng loại bỏ số lượng kg.
          meta: stripSensitiveMeta(item.meta),
        };
      }
      if (item.type === 'harvest') {
        return {
          ...item,
          description: redactKgFromText(item.description),
          meta: stripSensitiveMeta(item.meta),
        };
      }
      return item;
    });
}

function stripSensitiveMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const { quantityKg, yieldEstimateKg, orderNo, orderId, transactionRef, ...rest } = meta;
  void quantityKg;
  void yieldEstimateKg;
  void orderNo;
  void orderId;
  void transactionRef;
  return rest;
}

/** Bỏ các con số kg cụ thể trong mô tả (ví dụ: "Nhập 1500kg" → "Nhập sản phẩm"). */
function redactKgFromText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\d[\d.,]*\s*kg\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-sm text-muted-foreground">
      <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
      {text}
    </div>
  );
}

function TraceabilityDetailSkeleton() {
  return (
    <div className="bg-background pb-20">
      <div className="pt-[78px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Skeleton className="aspect-square rounded-3xl lg:col-span-2" />
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 mt-12 rounded-2xl" />
      </div>
    </div>
  );
}
