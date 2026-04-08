import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Minus,
  Plus,
  Star,
  Heart,
  Share2,
  Leaf,
  ShieldCheck,
  Truck,
  RefreshCw,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCartStore } from '@/client/store';
import {
  getProductBySlug,
  getRelatedProducts,
  getProductReviews,
  formatPrice,
} from '@/client/data/mock-data';
import { GRADE_LABELS, CROP_TYPES } from '@/client/types';
import { toast } from 'sonner';
import { ProductCard } from '@/client/components/product-card';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, isInCart } = useCartStore();
  const product = slug ? getProductBySlug(slug) : undefined;

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-muted-foreground mb-4">Sản phẩm bạn đang tìm kiếm không tồn tại.</p>
        <Button onClick={() => navigate('/products')}>Xem tất cả sản phẩm</Button>
      </div>
    );
  }

  const reviews = getProductReviews(product.id);
  const related = getRelatedProducts(product, 4);
  const inCart = isInCart(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Đã thêm ${quantity}kg "${product.name}" vào giỏ hàng!`);
  };

  const gradeColor =
    product.grade === 'A'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : product.grade === 'B'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-[78px]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary transition-colors">Sản phẩm</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>
    </div>

      {/* Main Content */ }
  <div className="container mx-auto px-4 pb-16">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Gallery */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        {/* Main Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/30 border">
          <img
            src={product.imageUrls[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className={`${gradeColor} font-semibold`}>
              {GRADE_LABELS[product.grade]}
            </Badge>
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              <Leaf className="h-3 w-3 mr-1 text-green-600" />
              {CROP_TYPES[product.cropType as keyof typeof CROP_TYPES]}
            </Badge>
          </div>
          {/* Nav arrows */}
          {product.imageUrls.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity"
                onClick={() => setSelectedImage((i) => (i - 1 + product.imageUrls.length) % product.imageUrls.length)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity"
                onClick={() => setSelectedImage((i) => (i + 1) % product.imageUrls.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {product.imageUrls.length > 1 && (
          <div className="flex gap-3">
            {product.imageUrls.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/30'
                  }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Product Info */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {/* Title & Rating */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
            {product.name}
          </h1>

          {reviews.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(avgRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground/30'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} đánh giá)</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="bg-primary/5 rounded-2xl p-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">
              {formatPrice(product.pricePerKg)}
            </span>
            <span className="text-lg text-muted-foreground">/kg</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tồn kho: <span className={product.stockKg > 0 ? 'text-green-600' : 'text-red-500'}>
              {product.stockKg > 0 ? `${product.stockKg} kg có sẵn` : 'Hết hàng'}
            </span>
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-semibold">Mô tả sản phẩm</h3>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>

        {/* QR Code */}
        {product.qrCode && (
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
            <QrCode className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Mã QR sản phẩm</p>
              <p className="text-xs text-muted-foreground font-mono">{product.qrCode}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Quantity Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Số lượng (kg)</label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-xl overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-none"
                onClick={() => setQuantity((q) => Math.max(product.minOrderKg, q - 1))}
                disabled={quantity <= product.minOrderKg}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= product.minOrderKg) {
                    setQuantity(val);
                  }
                }}
                min={product.minOrderKg}
                max={product.stockKg}
                step={0.5}
                className="w-20 h-12 text-center border-x outline-none text-lg font-semibold bg-background"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-none"
                onClick={() => setQuantity((q) => Math.min(product.stockKg, q + 1))}
                disabled={quantity >= product.stockKg}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              Tối thiểu: {product.minOrderKg}kg
            </span>
          </div>

          {/* Total Price */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Thành tiền:</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(product.pricePerKg * quantity)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 rounded-xl h-12 gap-2"
            onClick={handleAddToCart}
            disabled={product.status !== 'PUBLISHED' || product.stockKg === 0}
          >
            <ShoppingCart className="h-5 w-5" />
            {inCart ? 'Thêm vào giỏ hàng' : 'Thêm vào giỏ hàng'}
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-xl p-0">
            <Heart className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-xl p-0">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
            <span className="text-xs">Cam kết chất lượng</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
            <Truck className="h-5 w-5 text-blue-600 shrink-0" />
            <span className="text-xs">Giao hàng nhanh 24h</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
            <RefreshCw className="h-5 w-5 text-orange-600 shrink-0" />
            <span className="text-xs">Đổi trả 24h</span>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Reviews Section */}
    {reviews.length > 0 && (
      <div className="mt-16">
        <Separator className="mb-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold">Đánh Giá Sản Phẩm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.clientAvatar} />
                      <AvatarFallback>{review.clientName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{review.clientName}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${star <= review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-muted-foreground/30'
                                }`}
                            />
                          ))}
                        </div>
                        {review.verifiedPurchase && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                            <Check className="h-2.5 w-2.5 mr-0.5" />
                            Đã mua hàng
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    )}

    {/* Related Products */}
    {related.length > 0 && (
      <div className="mt-16">
        <Separator className="mb-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold">Sản Phẩm Liên Quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </motion.div>
      </div>
    )}
  </div>
    </div >
  );
}
