import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Banknote,
  Lock,
  MapPin,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCart, useClearCart, useCreateOrder, useMe } from '@/client/api';
import { useAuthStore } from '@/client/store';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/client/types';
import { apiPost } from '@/client/lib/api-client';

const PAYMENT_METHODS = [
  {
    value: 'COD',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Trả tiền mặt khi nhận được hàng',
    icon: Banknote,
  },
  {
    value: 'VNPAY',
    label: 'Chuyển khoản ngân hàng (VNPay)',
    description: 'Thanh toán qua cổng VNPay',
    icon: CreditCard,
  },
  {
    value: 'MOMO',
    label: 'Thẻ tín dụng / ví MoMo',
    description: 'Thanh toán qua ví MoMo hoặc thẻ tín dụng',
    icon: Smartphone,
  },
];

export default function CheckoutPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: cart } = useCart(isAuthenticated);
  const { data: me } = useMe();
  const clearCart = useClearCart();
  const createOrder = useCreateOrder();
  const location = useLocation();

  const selectedIds = (location.state as { selectedIds?: string[] } | null)?.selectedIds;
  const allItems = cart?.items ?? [];
  const items = selectedIds?.length
    ? allItems.filter((i) => selectedIds.includes(i.id))
    : allItems;
  const subtotal = items.reduce(
    (sum, i) => sum + i.product.pricePerKg * i.quantityKg,
    0,
  );
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const savedAddresses = me?.clientProfile?.shippingAddresses ?? [];

  const [step, setStep] = useState<'info' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderNo, setCreatedOrderNo] = useState<string>('');
  const [orderTotal, setOrderTotal] = useState<number>(0);

  const [selectedAddress, setSelectedAddress] = useState(savedAddresses[0] ?? null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  useEffect(() => {
    const addr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
    if (addr && !selectedAddress) {
      setSelectedAddress(addr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses.length]);

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;
    // Demo: giảm 10% tối đa 50k
    const discount = Math.min(Math.round(subtotal * 0.1), 50000);
    setVoucherDiscount(discount);
    toast.success(`Đã áp dụng mã giảm giá: -${formatPrice(discount)}`);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({
          productId: i.product.id,
          quantityKg: i.quantityKg,
        })),
        shippingAddr: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          addressLine: selectedAddress.addressLine,
          district: selectedAddress.district || undefined,
          province: selectedAddress.province,
        },
        paymentMethod,
        note: undefined,
      });

      setCreatedOrderNo(order.orderNo);
      setOrderTotal(total - voucherDiscount);

      // Nếu COD: clear cart và tới success
      if (paymentMethod === 'COD') {
        await clearCart.mutateAsync();
        setStep('success');
        return;
      }

      // VNPay/MoMo: tạo session thanh toán giả lập và redirect
      const res = await apiPost<{ data: { paymentUrl: string } }>(
        '/payment/create',
        { orderId: order.id, method: paymentMethod },
      );
      await clearCart.mutateAsync();
      const paymentUrl = (res.data as unknown as { data?: { paymentUrl?: string } })
        ?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      setStep('success');
    } catch {
      // toast shown by mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && step === 'info') {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {selectedIds?.length ? 'Không có sản phẩm nào được chọn' : 'Giỏ hàng trống'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {selectedIds?.length ? 'Vui lòng quay lại giỏ hàng và chọn sản phẩm.' : 'Vui lòng thêm sản phẩm trước khi thanh toán.'}
          </p>
          <Button asChild>
            <Link to="/cart">Quay lại giỏ hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="bg-background min-h-screen pt-[110px]">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center space-y-6"
          >
            <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-14 w-14 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Đặt Hàng Thành Công!</h2>
              <p className="text-muted-foreground">
                Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý và sẽ được giao trong 24-48h.
              </p>
            </div>
            <div className="bg-muted/30 rounded-2xl p-6 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <span className="font-mono font-semibold">{createdOrderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phương thức thanh toán</span>
                <span className="font-medium">
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng thanh toán</span>
                <span className="font-bold text-primary text-lg">{formatPrice(orderTotal)}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" asChild>
                <Link to="/orders">Xem đơn hàng</Link>
              </Button>
              <Button className="flex-1 rounded-xl" asChild>
                <Link to="/products">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pt-[110px]">
      <div className="container mx-auto px-4 pb-16">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Quay lại giỏ hàng
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Thanh Toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-primary" />
                      Địa chỉ nhận hàng
                    </CardTitle>
                    {savedAddresses.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setAddressDialogOpen(true)}>
                        Thay đổi
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedAddress ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{selectedAddress.fullName}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-sm">{selectedAddress.phone}</span>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {selectedAddress.addressType === 'OFFICE' ? 'Văn phòng' : 'Nhà riêng'}
                        </Badge>
                        {selectedAddress.isDefault && (
                          <Badge className="text-[10px]">Mặc định</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedAddress.addressLine}
                        {selectedAddress.district ? `, ${selectedAddress.district}` : ''}, {selectedAddress.province}
                      </p>
                    </div>
                  ) : savedAddresses.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <p>Bạn chưa có địa chỉ giao hàng.</p>
                      <Button variant="link" size="sm" className="px-0" asChild>
                        <Link to="/profile">Thêm địa chỉ mới</Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Đang tải địa chỉ...</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Products Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sản phẩm đã chọn ({items.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={item.product.thumbnailUrl || item.product.imageUrls?.[0] || ''}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantityKg}kg × {formatPrice(item.product.pricePerKg)}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(item.product.pricePerKg * item.quantityKg)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Voucher Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="h-4 w-4 text-primary" />
                    Voucher / Mã giảm giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã giảm giá"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleApplyVoucher} disabled={!voucherCode.trim()}>
                      Áp dụng
                    </Button>
                  </div>
                  {voucherDiscount > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      Đã giảm: {formatPrice(voucherDiscount)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Methods */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Phương thức thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                    className="space-y-2"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <Label
                        key={method.value}
                        htmlFor={method.value}
                        className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem value={method.value} id={method.value} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <method.icon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{method.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Chi tiết thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng tiền hàng</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                      {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                    </span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giảm giá voucher</span>
                      <span className="text-green-600">-{formatPrice(voucherDiscount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Tổng thanh toán</span>
                    <span className="text-primary text-lg">{formatPrice(total - voucherDiscount)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-xl h-12"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || items.length === 0 || !selectedAddress}
                >
                  {isSubmitting ? (
                    <>
                      <Lock className="h-4 w-4 mr-2 animate-pulse" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Đặt hàng
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Thanh toán an toàn & bảo mật
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Address Selection Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn địa chỉ giao hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAddress?.id === addr.id
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-muted/30'
                }`}
                onClick={() => {
                  setSelectedAddress(addr);
                  setAddressDialogOpen(false);
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{addr.fullName}</span>
                  <span className="text-muted-foreground text-sm">|</span>
                  <span className="text-xs text-muted-foreground">{addr.phone}</span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {addr.addressType === 'OFFICE' ? 'Văn phòng' : 'Nhà riêng'}
                  </Badge>
                  {addr.isDefault && <Badge className="text-[10px]">Mặc định</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {addr.addressLine}{addr.district ? `, ${addr.district}` : ''}, {addr.province}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setAddressDialogOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
