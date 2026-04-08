import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Eye, Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/client/data/mock-data';
import type { Product } from '@/client/types';
import { toast } from 'sonner';
import { useCartStore } from '@/client/store';
import { useAuthStore } from '@/client/store';
import { GRADE_LABELS, CROP_TYPES } from '@/client/types';

interface ProductCardProps {
  product: Product;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem, isInCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const inCart = isInCart(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      navigate('/auth/login');
      return;
    }

    addItem(product, product.minOrderKg);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const gradeColor =
    product.grade === 'A'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : product.grade === 'B'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link to={`/products/${product.slug}`}>
        <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-muted/30">
            <img
              src={product.imageUrls[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Grade Badge */}
            <div className="absolute top-3 left-3">
              <Badge className={`${gradeColor} text-xs font-semibold shadow-sm`}>
                {GRADE_LABELS[product.grade]}
              </Badge>
            </div>

            {/* Crop Type Badge */}
            <div className="absolute top-3 right-3">
              <Badge
                variant="secondary"
                className="bg-background/90 backdrop-blur-sm text-xs shadow-sm"
              >
                <Leaf className="h-3 w-3 mr-1 text-green-600" />
                {CROP_TYPES[product.cropType as keyof typeof CROP_TYPES] || product.cropType}
              </Badge>
            </div>

            {/* Out of Stock Overlay */}
            {product.status === 'OUT_OF_STOCK' && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  Hết hàng
                </Badge>
              </div>
            )}

            {/* Hover Action Buttons */}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {product.status === 'PUBLISHED' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className={`h-8 px-3 gap-1.5 rounded-lg ${inCart ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs">{inCart ? 'Đã thêm' : 'Thêm'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-4 flex-1 flex flex-col">
            {/* Rating */}
            {product.reviewCount !== undefined && product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium">
                  {(product.averageRating || 0).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount} đánh giá)
                </span>
              </div>
            )}

            {/* Product Name */}
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground mb-auto group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Stock Info */}
            <div className="mt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-primary">
                  {formatPrice(product.pricePerKg)}
                  <span className="text-xs font-normal text-muted-foreground">/kg</span>
                </p>
                {product.stockKg > 0 && product.stockKg <= 20 && (
                  <p className="text-xs text-orange-500 font-medium">
                    Chỉ còn {product.stockKg}kg
                  </p>
                )}
              </div>

              {product.status === 'PUBLISHED' && (
                <Button
                  size="sm"
                  className="h-9 rounded-xl px-3"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// ============================================================
// PRODUCT GRID
// ============================================================
interface ProductGridProps {
  products: Product[];
  className?: string;
}

export function ProductGrid({ products, className = '' }: ProductGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
}
