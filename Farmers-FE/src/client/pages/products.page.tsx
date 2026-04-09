import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Filter,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCard } from '@/client/components/product-card';
import { useCategories } from '@/client/hooks/use-queries';
import {
  MOCK_PRODUCTS,
  CROP_TYPE_OPTIONS,
  GRADE_OPTIONS,
  SORT_OPTIONS,
  PRICE_RANGES,
} from '@/client/data/mock-data';

const ITEMS_PER_PAGE = 12;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(4);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: categoriesData } = useCategories({ limit: 100 });

  // Read filters from URL
  const filters = {
    search: searchParams.get('search') || '',
    cropType: searchParams.get('cropType') || '',
    grade: searchParams.get('grade') || '',
    priceRange: searchParams.get('priceRange') || '',
    categoryId: searchParams.get('categoryId') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  };

  // Filter + sort products
  const filteredProducts = useMemo(() => {
    let results = [...MOCK_PRODUCTS].filter((p) => p.status === 'PUBLISHED');

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.cropType.toLowerCase().includes(q),
      );
    }

    if (filters.cropType) {
      results = results.filter((p) => p.cropType === filters.cropType);
    }

    if (filters.grade) {
      results = results.filter((p) => p.grade === filters.grade);
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map((v) => {
        if (v.endsWith('+')) return 0;
        return parseInt(v) || 0;
      });
      const maxVal = filters.priceRange.endsWith('+') ? Infinity : max;
      results = results.filter((p) => p.pricePerKg >= min && p.pricePerKg <= maxVal);
    }

    switch (filters.sortBy) {
      case 'price_asc':
        results.sort((a, b) => a.pricePerKg - b.pricePerKg);
        break;
      case 'price_desc':
        results.sort((a, b) => b.pricePerKg - a.pricePerKg);
        break;
      case 'rating':
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    return results;
  }, [filters]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (filters.page - 1) * ITEMS_PER_PAGE,
    filters.page * ITEMS_PER_PAGE,
  );

  // Active filters count
  const activeFiltersCount = [filters.cropType, filters.grade, filters.priceRange, filters.categoryId].filter(
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
    setSearchParams({ sortBy: filters.sortBy });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tìm kiếm</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tên sản phẩm..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
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
                onChange={() => updateFilter('cropType', opt.value)}
                className="accent-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
          {filters.cropType && (
            <button
              onClick={() => updateFilter('cropType', '')}
              className="text-xs text-primary hover:underline"
            >
              Bỏ chọn
            </button>
          )}
        </div>
      </div>

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
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Active Filter Tags */}
          <div className="hidden lg:flex items-center gap-2 flex-1">
            {filters.categoryId && (
              <Badge variant="secondary" className="gap-1 rounded-lg">
                {categoriesData?.data.find((c) => c.id === filters.categoryId)?.name}
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
                  onClick={() => updateFilter('cropType', '')}
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
              <FilterContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {paginatedProducts.length > 0 ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`grid gap-4 md:gap-6 ${gridCols === 2
                    ? 'grid-cols-2'
                    : gridCols === 3
                      ? 'grid-cols-2 md:grid-cols-3'
                      : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    }`}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>

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
                    {Array.from({ length: totalPages }).map((_, i) => (
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
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground mb-4">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
