import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Leaf, Star, ShoppingBag, Sprout, MapPin, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMockBanners } from '@/client/hooks/use-mock-queries';
import { formatPrice } from '@/client/data/mock-data';
import { MOCK_PRODUCTS } from '@/client/data/mock-data';

// ============================================================
// DASHED CARD — Wrapper cho các section card với dashed border
// ============================================================
function DashedCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        rounded-3xl border-2 border-dashed border-border
        bg-card/80 backdrop-blur-sm
        hover:border-primary/40 hover:bg-card
        transition-all duration-300
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================
// HERO CAROUSEL — với dashed container
// ============================================================
function HeroCarousel() {
  const { data: banners } = useMockBanners();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = () => setCurrent((c) => (c + 1) % banners.length);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(next, 2500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, banners.length]);

  if (!banners.length) return null;

  return (
    <section className="relative w-full group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative h-[280px] sm:h-[380px] md:h-[480px] lg:h-[560px] w-full overflow-hidden rounded-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Background Image */}
          <img
            src={banners[current].imageUrl}
            alt={banners[current].title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Enhanced Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/20" />

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="w-full px-6 sm:px-12 lg:px-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="max-w-2xl space-y-4"
              >
                <div className="inline-flex items-center gap-1.5 bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-primary/40">
                  <Leaf className="h-3 w-3" />
                  100% Tự Nhiên
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                  {banners[current].title}
                </h1>
                <p className="text-base sm:text-lg text-white/80 leading-relaxed">
                  {banners[current].subtitle}
                </p>
                <Link to={banners[current].ctaLink}>
                  <Button variant="glass-primary" size="lg" className="mt-4">
                    {banners[current].cta}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        {banners.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current
              ? 'w-7 bg-white'
              : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// CATEGORIES SECTION — với dashed card grid
// ============================================================
function CategoriesSection() {
  const categories = [
    {
      name: 'Sầu Riêng Tươi',
      slug: 'sau-rieng-tuoi',
      image: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=600&q=80',
      description: 'Trái chín cây, đạt chuẩn VietGAP',
    },
    {
      name: 'Sầu Riêng Đông Lạnh',
      slug: 'sau-rieng-dong-lanh',
      image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&q=80',
      description: 'Công nghệ IQF, bảo quản 6 tháng',
    },
    {
      name: 'Cà Phê Hạt',
      slug: 'ca-phe-hat',
      image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
      description: '100% rang mộc, không tẩm hương',
    },
    {
      name: 'Cà Phê Bột',
      slug: 'ca-phe-bot',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
      description: 'Xay sẵn, tiện lợi pha ngay',
    },
    {
      name: 'Cà Phê Đặc Sản',
      slug: 'ca-phe-dac-san',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
      description: 'Single origin, điểm cupping 84+',
    },
    {
      name: 'Combo Quà Tặng',
      slug: 'combo-qua-tang',
      image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80',
      description: 'Quà tặng cao cấp, ý nghĩa',
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-3"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Danh Mục</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Khám Phá Sản Phẩm
          </h2>
          <p className="text-base text-foreground/70 max-w-2xl mx-auto mt-4">
            Bộ sưu tập sầu riêng và cà phê chất lượng cao, nguồn gốc từ Tây Nguyên
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <Link to={`/categories/${cat.slug}`}>
                <div className="overflow-hidden rounded-lg group cursor-pointer h-full bg-card/50 border border-white/10 hover:border-primary/30 hover:bg-card/80 transition-all duration-300">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURED PRODUCTS SECTION — với dashed cards
// ============================================================
function FeaturedProductsSection() {
  const featured = MOCK_PRODUCTS.filter(
    (p) => p.status === 'PUBLISHED' && p.stockKg > 0,
  )
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 8);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground border-b-2 border-dashed border-primary/30 inline-block pb-2">
              Sản Phẩm Nổi Bật
            </h2>
            <p className="text-muted-foreground">
              Những sản phẩm được khách hàng yêu thích nhất
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" size="lg" className="rounded-xl gap-2">
              Xem tất cả
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -6 }}
            >
              <Link to={`/products/${product.slug}`}>
                <DashedCard className="overflow-hidden hover:border-primary/60 transition-all duration-300 h-full flex flex-col group">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-muted/30">
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-dashed border-amber-400/30">
                        {product.grade === 'A' ? 'Hạng A' : 'Hạng B'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-amber-500 font-medium">
                        {(product.averageRating || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount} đánh giá)
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-base font-bold text-primary border border-dashed border-primary/20 rounded-lg px-2 py-0.5 bg-primary/5">
                        {formatPrice(product.pricePerKg)}
                        <span className="text-xs font-normal text-muted-foreground">/kg</span>
                      </p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border border-dashed border-border">
                        {product.cropType === 'SAU_RIENG' ? 'Sầu Riêng' : 'Cà Phê'}
                      </span>
                    </div>
                  </div>
                </DashedCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PROMO BANNER — với dashed border
// ============================================================
function PromoBanner() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-800 to-green-600 text-white border-2 border-dashed border-green-400/40"
        >
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>
          <div className="relative px-6 sm:px-12 py-12 sm:py-16 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-full w-fit border border-dashed border-white/30">
                🎉 Khuyến mãi đặc biệt
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold">
                Giảm 10% cho đơn hàng đầu tiên
              </h3>
              <p className="text-white/80 max-w-md">
                Đăng ký tài khoản ngay hôm nay và nhận ngay voucher 10% cho lần mua sắm đầu tiên.
                Áp dụng cho tất cả sản phẩm sầu riêng và cà phê.
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Link to="/auth/register">
                  <Button variant="glass-primary" size="lg">
                    Đăng Ký Ngay
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" size="lg" className="border-white/50 hover:bg-white/10">
                    Xem sản phẩm
                  </Button>
                </Link>
              </div>
            </div>
            <div className="shrink-0">
              <div className="w-48 h-48 rounded-2xl shadow-2xl border-2 border-dashed border-white/20 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=300&q=80"
                  alt="Sầu riêng"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// WHY CHOOSE US — với dashed feature cards
// ============================================================
function WhyChooseSection() {
  const features = [
    {
      icon: Sprout,
      title: '100% Tự Nhiên',
      description: 'Sản phẩm không chất bảo quản, không phụ gia hóa học',
      borderVar: 'border-[var(--primary)]/30',
      textVar: 'text-[var(--primary)]',
    },
    {
      icon: MapPin,
      title: 'Nguồn Gốc Rõ Ràng',
      description: 'Truy xuất nguồn gốc từng sản phẩm qua mã QR',
      borderVar: 'border-[var(--tertiary)]/30',
      textVar: 'text-[var(--tertiary)]',
    },
    {
      icon: Truck,
      title: 'Giao Hàng Nhanh',
      description: 'Giao hàng trong 24-48h trên toàn quốc, đảm bảo tươi ngon',
      borderVar: 'border-[var(--warning-500)]/30',
      textVar: 'text-[var(--warning-500)]',
    },
    {
      icon: CheckCircle,
      title: 'Cam Kết Chất Lượng',
      description: 'Đổi trả 100% nếu sản phẩm không đúng chất lượng',
      borderVar: 'border-[var(--success-500)]/30',
      textVar: 'text-[var(--success-500)]',
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 space-y-2"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground border-b-2 border-dashed border-primary/30 inline-block pb-2">
            Tại Sao Chọn Farmers?
          </h2>
          <p className="text-muted-foreground">
            Cam kết mang đến sản phẩm tốt nhất cho khách hàng
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, i) => {
            const IconComponent = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <DashedCard className={`text-center p-6 hover:border-primary/40 transition-all duration-300 ${feat.borderVar}`}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-current/10 mb-3 ${feat.textVar}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className={`font-semibold mb-2 ${feat.textVar}`}>{feat.title}</h3>
                  <p className="text-sm text-muted-foreground">{feat.description}</p>
                </DashedCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CTA SECTION — với dashed card
// ============================================================
function CTASection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <DashedCard className="p-8 sm:p-12 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl border border-dashed border-primary/30 mx-auto">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Bắt đầu mua sắm ngay hôm nay
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Hàng nghìn sản phẩm sầu riêng và cà phê đang chờ bạn. Đăng ký miễn phí để nhận ưu đãi đặc biệt.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/auth/register">
                <Button variant="primary" size="lg" className="gap-2">
                  Tạo tài khoản miễn phí
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg" className="hover:border-[var(--primary)]/60 hover:bg-primary/5">
                  Khám phá sản phẩm
                </Button>
              </Link>
            </div>
          </motion.div>
        </DashedCard>
      </div>
    </section>
  );
}

// ============================================================
// HOME PAGE
// ============================================================
export default function HomePage() {
  return (
    <div>
      {/* Hero Carousel */}
      <section className="pb-2">
        <HeroCarousel />
      </section>

      {/* Categories */}
      <CategoriesSection />

      {/* Featured Products */}
      <FeaturedProductsSection />

      {/* Promo Banner */}
      <PromoBanner />

      {/* Why Choose Us */}
      <WhyChooseSection />

      {/* CTA */}
      <CTASection />
    </div>
  );
}
