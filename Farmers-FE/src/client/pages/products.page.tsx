import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  Search,
  PackageSearch,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCard } from '@/client/components/product-card';
import { useCategories, useProducts } from '@/client/api';
import {
  CROP_TYPE_OPTIONS,
  GRADE_OPTIONS,
  SORT_OPTIONS,
  PRICE_RANGES,
} from '@/client/data/mock-data';
import { getVarietiesForCrop } from '@/client/data/crop-config';

const ITEMS_PER_PAGE = 12;

interface ClientCategory {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface ClientCategoriesData {
  data: ClientCategory[];
}

interface FilterContentProps {
  filters: {
    search: string;
    cropType: string;
    variety: string;
    grade: string;
    priceRange: string;
    categoryId: string;
    sortBy: string;
    page: number;
  };
  categoriesData?: ClientCategoriesData;
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}

const SearchInput = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Tên sản phẩm..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

const FilterContent = ({
  filters,
  categoriesData,
  updateFilter,
  clearFilters,
  activeFiltersCount,
}: FilterContentProps) => (
  <div className="space-y-6">
    {/* Search */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Tìm kiếm</label>
      <SearchInput 
        value={filters.search} 
        onChange={(val) => updateFilter('search', val)} 
      />
    </div>

    <Separator />

    {/* Category */}
    <div className="space-y-3">
      <label className="text-sm font-medium">Danh mục</label>
      <div className="space-y-2">
        {categoriesData?.data.map((cat) => (
          <label
            key={cat.id}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="radio"
              name="categoryId"
              value={cat.id}
              checked={filters.categoryId === cat.id}
              onChange={() => updateFilter('categoryId', cat.id)}
              className="accent-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
              {cat.name}
            </span>
            {cat.productCount !== undefined && (
              <span className="text-xs text-muted-foreground">({cat.productCount})</span>
            )}
          </label>
        ))}
        {filters.categoryId && (
          <button
            onClick={() => updateFilter('categoryId', '')}
            className="text-xs text-primary hover:underline"
          >
            Bỏ chọn
          </button>
        )}
      </div>
    </div>

    <Separator />

    {/* Crop Type */}
    <div className="space-y-3">
      <label className="text-sm font-medium">Loại sản phẩm</label>
      <div className="space-y-2">
        {CROP_TYPE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="radio"
              name="cropType"
              value={opt.value}
              checked={filters.cropType === opt.value}
              onChange={() => { updateFilter('cropType', opt.value); updateFilter('variety', ''); }}
              className="accent-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {opt.label}
            </span>
          </label>
        ))}
        {filters.cropType && (
          <button
            onClick={() => { updateFilter('cropType', ''); updateFilter('variety', ''); }}
            className="text-xs text-primary hover:underline"
          >
            Bỏ chọn
          </button>
        )}
      </div>
    </div>

    {/* Variety — only show when cropType is selected */}
    {filters.cropType && getVarietiesForCrop(filters.cropType).length > 0 && (
      <>
        <Separator />
        <div className="space-y-3">
          <label className="text-sm font-medium">Giống</label>
          <div className="space-y-2">
            {getVarietiesForCrop(filters.cropType).map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="variety"
                  value={v}
                  checked={filters.variety === v}
                  onChange={() => updateFilter('variety', v)}
                  className="accent-primary"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{v}</span>
              </label>
            ))}
            {filters.variety && (
              <button onClick={() => updateFilter('variety', '')} className="text-xs text-primary hover:underline">
                Bỏ chọn
              </button>
            )}
          </div>
        </div>
      </>
    )}

    <Separator />

    {/* Grade */}
    <div className="space-y-3">
      <label className="text-sm font-medium">Hạng chất lượng</label>
      <div className="flex flex-wrap gap-2">
        {GRADE_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={filters.grade === opt.value ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() =>
              updateFilter(
                'grade',
                filters.grade === opt.value ? '' : opt.value,
              )
            }
          >
            {opt.label}
          </Badge>
        ))}
      </div>
    </div>

    <Separator />

    {/* Price Range */}
    <div className="space-y-3">
      <label className="text-sm font-medium">Khoảng giá</label>
      <div className="space-y-2">
        {PRICE_RANGES.map((range) => (
          <label
            key={range.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="radio"
              name="priceRange"
              value={range.value}
              checked={filters.priceRange === range.value}
              onChange={() => updateFilter('priceRange', range.value)}
              className="accent-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {range.label}
            </span>
          </label>
        ))}
      </div>
    </div>

    {activeFiltersCount > 0 && (
      <>
        <Separator />
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-lg"
          onClick={clearFilters}
        >
          Xóa tất cả bộ lọc
        </Button>
      </>
    )}
  </div>
);

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: categorySlugParam } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(4);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: categoriesData } = useCategories({ limit: 100 });
  const categories = useMemo(
    () => (categoriesData as ClientCategoriesData | undefined)?.data ?? [],
    [categoriesData],
  );

  // Read filters from URL
  const filters = {
    search: searchParams.get('search') || '',
    cropType: searchParams.get('cropType') || '',
    variety: searchParams.get('variety') || '',
    grade: searchParams.get('grade') || '',
    priceRange: searchParams.get('priceRange') || '',
    categoryId: searchParams.get('categoryId') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  };

  // If route is /categories/:slug, map slug -> categoryId and override
  const effectiveCategoryId = useMemo(() => {
    const slug = categorySlugParam || '';
    if (!slug) return filters.categoryId;
    const found = categories.find((c) => c.slug === slug);
    return found?.id || filters.categoryId;
  }, [categorySlugParam, categories, filters.categoryId]);

  // Transform price range for API
  const { minPrice, maxPrice } = useMemo(() => {
    if (!filters.priceRange) return { minPrice: undefined, maxPrice: undefined };
    
    if (filters.priceRange.endsWith('+')) {
      return { 
        minPrice: parseInt(filters.priceRange.replace('+', '')) || 0, 
        maxPrice: undefined 
      };
    }
    
    const [min, max] = filters.priceRange.split('-').map(v => parseInt(v) || 0);
    return { minPrice: min, maxPrice: max };
  }, [filters.priceRange]);

  // Fetch products from API
  const { data: productsData, isLoading } = useProducts({
    page: filters.page,
    limit: ITEMS_PER_PAGE,
    search: filters.search,
    cropType: filters.cropType,
    variety: filters.variety,
    grade: filters.grade,
    minPrice,
    maxPrice,
    categoryId: effectiveCategoryId,
    sortBy: filters.sortBy,
  });

  const products = productsData?.items || [];
  const totalPages = productsData?.totalPages || 1;

  // Active filters count
  const activeFiltersCount = [filters.cropType, filters.variety, filters.grade, filters.priceRange, effectiveCategoryId].filter(
    Boolean,
  ).length;

  // Update URL
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    if (categorySlugParam) {
      navigate(`/products?sortBy=${encodeURIComponent(filters.sortBy)}`, {
        replace: true,
      });
    } else {
      setSearchParams({ sortBy: filters.sortBy });
    }
  };

  return (
    <div className="bg-background min-h-screen pt-[78px]">

      <div className="container mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Mobile Filter Button */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden gap-2 rounded-xl">
                <Filter className="h-4 w-4" />
                Bộ lọc
                {activeFiltersCount > 0 && (
                  <Badge variant="default" className="h-5 w-5 p-0 justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
                <SheetDescription>Chọn bộ lọc để tìm sản phẩm phù hợp</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent
                  filters={{ ...filters, categoryId: effectiveCategoryId }}
                  categoriesData={categoriesData}
                  updateFilter={updateFilter}
                  clearFilters={clearFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Active Filter Tags */}
          <div className="hidden lg:flex items-center gap-2 flex-1">
            {effectiveCategoryId && (
              <Badge variant="secondary" className="gap-1 rounded-lg">
                {categories.find((c) => c.id === effectiveCategoryId)?.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('categoryId', '')}
                />
              </Badge>
            )}
            {filters.cropType && (
              <Badge variant="secondary" className="gap-1 rounded-lg">
                {CROP_TYPE_OPTIONS.find((o) => o.value === filters.cropType)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => { updateFilter('cropType', ''); updateFilter('variety', ''); }}
                />
              </Badge>
            )}
            {filters.variety && (
              <Badge variant="secondary" className="gap-1 rounded-lg">
                {filters.variety}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('variety', '')}
                />
              </Badge>
            )}
            {filters.grade && (
              <Badge variant="secondary" className="gap-1 rounded-lg">
                {GRADE_OPTIONS.find((o) => o.value === filters.grade)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('grade', '')}
                />
              </Badge>
            )}
            {filters.priceRange && (
              <Badge variant="secondary" className="gap-1 rounded-lg">
                {PRICE_RANGES.find((r) => r.value === filters.priceRange)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('priceRange', '')}
                />
              </Badge>
            )}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={clearFilters}
              >
                Xóa tất cả
              </Button>
            )}
          </div>

          {/* Sort + Grid */}
          <div className="flex items-center gap-3">
            <Select value={filters.sortBy} onValueChange={(v) => updateFilter('sortBy', v)}>
              <SelectTrigger className="w-44 rounded-xl h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Grid Size Toggle */}
            <div className="hidden sm:flex items-center gap-1 border rounded-xl p-1">
              <Button
                variant={gridCols === 2 ? 'primary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => setGridCols(2)}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={gridCols === 3 ? 'primary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => setGridCols(3)}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={gridCols === 4 ? 'primary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => setGridCols(4)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex gap-8">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 p-5 border rounded-2xl bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Bộ lọc
              </h3>
              <FilterContent
                filters={filters}
                categoriesData={categoriesData}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-h-[400px]">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`grid gap-4 md:gap-6 ${
                    gridCols === 2
                      ? 'grid-cols-2'
                      : gridCols === 3
                      ? 'grid-cols-2 md:grid-cols-3'
                      : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-square rounded-2xl w-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : products.length > 0 ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className={`grid gap-4 md:gap-6 ${
                      gridCols === 2
                        ? 'grid-cols-2'
                        : gridCols === 3
                        ? 'grid-cols-2 md:grid-cols-3'
                        : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    }`}
                  >
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={filters.page <= 1}
                        onClick={() => updateFilter('page', String(filters.page - 1))}
                      >
                        Trước
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                        <Button
                          key={i}
                          variant={filters.page === i + 1 ? 'primary' : 'outline'}
                          size="sm"
                          className="w-10 h-10 rounded-xl"
                          onClick={() => updateFilter('page', String(i + 1))}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      {totalPages > 5 && <span className="text-muted-foreground">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={filters.page >= totalPages}
                        onClick={() => updateFilter('page', String(filters.page + 1))}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-24 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200"
                >
                  <div className="flex justify-center mb-6">
                    <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                      <PackageSearch className="h-12 w-12 text-slate-300" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-muted-foreground mb-8 max-w-[300px] mx-auto text-sm">
                    Rất tiếc, chúng tôi không tìm thấy sản phẩm nào khớp với bộ lọc hiện tại của bạn.
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="rounded-full px-8 h-11 border-primary/20 text-primary hover:bg-primary/5 font-bold">
                    Thiết lập lại bộ lọc
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
