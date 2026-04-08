import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/client/store';
import { formatPrice } from '@/client/data/mock-data';
import { toast } from 'sonner';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto space-y-6"
          >
            <div className="w-32 h-32 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Giỏ hàng trống</h2>
              <p className="text-muted-foreground">
                Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá và thêm sản phẩm yêu thích nhé!
              </p>
            </div>
            <Button size="lg" className="rounded-xl" asChild>
              <Link to="/products">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Khám Phá Sản Phẩm
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Giỏ Hàng</h1>
          <p className="text-muted-foreground">
            {itemCount} sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="shrink-0"
                      >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted/30">
                          <img
                            src={item.product.imageUrls[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>

                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            {item.product.cropType === 'SAU_RIENG' ? '🌿 Sầu Riêng' : '☕ Cà Phê'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            Hạng {item.product.grade}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Price */}
                          <p className="font-bold text-primary">
                            {formatPrice(item.product.pricePerKg * item.quantityKg)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded-lg overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() =>
                                  updateQuantity(item.productId, item.quantityKg - 1)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-14 text-center text-sm font-medium">
                                {item.quantityKg}kg
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() =>
                                  updateQuantity(item.productId, item.quantityKg + 1)
                                }
                                disabled={item.quantityKg >= item.product.stockKg}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                removeItem(item.productId);
                                toast.info(`Đã xóa "${item.product.name}" khỏi giỏ hàng`);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Unit Price */}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatPrice(item.product.pricePerKg)}/kg
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Clear Cart */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  clearCart();
                  toast.info('Đã xóa toàn bộ giỏ hàng');
                }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Xóa toàn bộ
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link to="/products">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Tổng Quan Đơn Hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Summary */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground line-clamp-1 flex-1 pr-2">
                        {item.product.name} × {item.quantityKg}kg
                      </span>
                      <span className="font-medium shrink-0">
                        {formatPrice(item.product.pricePerKg * item.quantityKg)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-medium">
                    {shippingFee === 0 ? (
                      <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Miễn phí
                      </Badge>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>

                {shippingFee > 0 && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                    🎉 Mua thêm {formatPrice(500000 - subtotal)} để được miễn phí vận chuyển!
                  </p>
                )}

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Tổng cộng</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(subtotal + shippingFee)}
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  size="lg"
                  className="w-full rounded-xl h-12 mt-2"
                  onClick={handleCheckout}
                >
                  Tiến Hành Thanh Toán
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                {/* Security Note */}
                <p className="text-xs text-center text-muted-foreground">
                  Thanh toán an toàn & bảo mật 100%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
