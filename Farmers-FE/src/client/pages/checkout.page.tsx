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
  ShoppingBag,
  Truck,
  ShieldCheck,
  Receipt,
  Sparkles,
  ChevronRight,
  Plus,
  Phone,
  User,
  Home,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCart, useClearCart, useCreateOrder, useMe } from '@/client/api';
import { useAuthStore } from '@/client/store';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/client/types';
import { apiPost } from '@/client/lib/api-client';

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof Banknote;
  badge?: string;
  badgeTone?: 'success' | 'info' | 'warning';
}[] = [
  {
    value: 'COD',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Trả tiền mặt khi shipper giao đến nhà',
    icon: Banknote,
    badge: 'Phổ biến',
    badgeTone: 'success',
  },
  {
    value: 'VNPAY',
    label: 'Cổng thanh toán VNPay',
    description: 'Thẻ ATM nội địa, thẻ tín dụng, QR Pay',
    icon: CreditCard,
    badge: 'An toàn',
    badgeTone: 'info',
  },
  {
    value: 'MOMO',
    label: 'Ví điện tử MoMo',
    description: 'Quét QR hoặc thanh toán qua ứng dụng MoMo',
    icon: Smartphone,
    badge: 'Nhanh chóng',
    badgeTone: 'warning',
  },
];

const STEPS = [
  { label: 'Giỏ hàng', icon: ShoppingBag },
  { label: 'Thanh toán', icon: CreditCard },
  { label: 'Hoàn tất', icon: CheckCircle2 },
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
  const totalKg = items.reduce((sum, i) => sum + i.quantityKg, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const amountToFreeShipping = Math.max(0, 500000 - subtotal);
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
  const [note, setNote] = useState('');

  useEffect(() => {
    const addr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
    if (addr && !selectedAddress) {
      setSelectedAddress(addr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses.length]);

  const handleApplyVoucher = (code?: string) => {
    const c = (code ?? voucherCode).trim();
    if (!c) return;
    setVoucherCode(c);
    const discount = Math.min(Math.round(subtotal * 0.1), 50000);
    setVoucherDiscount(discount);
    toast.success(`Đã áp dụng mã: -${formatPrice(discount)}`);
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
        note: note.trim() || undefined,
      });

      setCreatedOrderNo(order.orderNo);
      setOrderTotal(total - voucherDiscount);

      if (paymentMethod === 'COD') {
        await clearCart.mutateAsync();
        setStep('success');
        return;
      }

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

  // ===== Empty state =====
  if (items.length === 0 && step === 'info') {
    return (
      <div className="bg-background min-h-screen pt-[110px]">
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {selectedIds?.length ? 'Không có sản phẩm nào được chọn' : 'Giỏ hàng trống'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {selectedIds?.length
              ? 'Quay lại giỏ hàng để chọn sản phẩm muốn thanh toán.'
              : 'Hãy thêm sản phẩm vào giỏ trước khi thanh toán nhé.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/cart">Quay lại giỏ hàng</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/products">Mua sắm ngay</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Success state =====
  if (step === 'success') {
    return (
      <div className="bg-background min-h-screen pt-[110px]">
        <div className="container mx-auto px-4 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
          >
            <StepIndicator current={2} />
            <div className="mt-10 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-950/40 rounded-full flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30"
              >
                <CheckCircle2 className="h-14 w-14 text-emerald-600" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Đặt hàng thành công!</h2>
                <p className="text-muted-foreground">
                  Cảm ơn bạn đã đặt hàng. Đơn của bạn đang được xử lý và sẽ giao trong 24–48 giờ.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-6 text-left space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Receipt className="h-4 w-4" />
                    Mã đơn hàng
                  </span>
                  <span className="font-mono font-semibold">{createdOrderNo}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Phương thức</span>
                  <span className="font-medium">
                    {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Tổng thanh toán</span>
                  <span className="font-bold text-primary text-xl">
                    {formatPrice(orderTotal)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-12" asChild>
                  <Link to="/orders">Xem đơn hàng</Link>
                </Button>
                <Button className="flex-1 rounded-xl h-12" asChild>
                  <Link to="/products">Tiếp tục mua sắm</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== Main checkout =====
  return (
    <div className="bg-background min-h-screen pt-[110px]">
      <div className="container mx-auto px-4 pb-20">
        {/* Top: back + step indicator */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4 -ml-3" asChild>
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Quay lại giỏ hàng
            </Link>
          </Button>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Thanh toán</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kiểm tra thông tin và hoàn tất đơn hàng của bạn
              </p>
            </div>
            <StepIndicator current={1} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ============ Main column ============ */}
          <div className="lg:col-span-2 space-y-5">
            {/* Address */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="rounded-2xl border-muted/60 overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={<MapPin className="h-5 w-5" />}
                    title="Địa chỉ nhận hàng"
                    action={
                      savedAddresses.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full h-8"
                          onClick={() => setAddressDialogOpen(true)}
                        >
                          Thay đổi
                        </Button>
                      )
                    }
                  />
                  {selectedAddress ? (
                    <div className="rounded-xl border bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20 p-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold">{selectedAddress.fullName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{selectedAddress.phone}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal gap-1 bg-background"
                        >
                          {selectedAddress.addressType === 'OFFICE' ? (
                            <>
                              <Building2 className="h-3 w-3" />
                              Văn phòng
                            </>
                          ) : (
                            <>
                              <Home className="h-3 w-3" />
                              Nhà riêng
                            </>
                          )}
                        </Badge>
                        {selectedAddress.isDefault && (
                          <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-600">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>
                          {selectedAddress.addressLine}
                          {selectedAddress.district ? `, ${selectedAddress.district}` : ''},{' '}
                          {selectedAddress.province}
                        </span>
                      </p>
                    </div>
                  ) : savedAddresses.length === 0 ? (
                    <Link
                      to="/profile"
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm địa chỉ giao hàng mới
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Đang tải địa chỉ...</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Products */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="rounded-2xl border-muted/60 overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={<ShoppingBag className="h-5 w-5" />}
                    title={`Sản phẩm (${items.length})`}
                    action={
                      <span className="text-xs text-muted-foreground">
                        Tổng {totalKg.toLocaleString('vi-VN')} kg
                      </span>
                    }
                  />
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex gap-4 ${
                          idx > 0 ? 'pt-3 border-t border-dashed' : ''
                        }`}
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 border">
                          <img
                            src={
                              item.product.thumbnailUrl ||
                              item.product.imageUrls?.[0] ||
                              ''
                            }
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                          <div>
                            <p className="text-sm font-semibold line-clamp-2 leading-snug">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.quantityKg} kg × {formatPrice(item.product.pricePerKg)}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-primary">
                            {formatPrice(item.product.pricePerKg * item.quantityKg)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Voucher */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl border-muted/60 overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={<Tag className="h-5 w-5" />}
                    title="Mã giảm giá"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="pl-10 h-11 rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={() => handleApplyVoucher()}
                      disabled={!voucherCode.trim()}
                      className="h-11 rounded-xl px-5"
                    >
                      Áp dụng
                    </Button>
                  </div>
                  {/* Suggested vouchers */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['FARMER10', 'FREESHIP', 'WELCOME50'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleApplyVoucher(code)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        {code}
                      </button>
                    ))}
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4" />
                      Đã áp dụng giảm giá: <span className="font-semibold">{formatPrice(voucherDiscount)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="rounded-2xl border-muted/60 overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={<CreditCard className="h-5 w-5" />}
                    title="Phương thức thanh toán"
                  />
                  <div className="space-y-2.5">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const active = paymentMethod === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            active
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/40 hover:bg-muted/30'
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-colors ${
                              active
                                ? 'bg-primary text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold">{method.label}</span>
                              {method.badge && (
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] font-normal ${
                                    method.badgeTone === 'success'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                      : method.badgeTone === 'info'
                                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                  }`}
                                >
                                  {method.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {method.description}
                            </p>
                          </div>
                          <div
                            className={`mt-1 h-5 w-5 rounded-full border-2 shrink-0 transition-all ${
                              active
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground/30'
                            }`}
                          >
                            {active && (
                              <CheckCircle2 className="h-full w-full text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Note */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="rounded-2xl border-muted/60 overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={<Receipt className="h-5 w-5" />}
                    title="Ghi chú đơn hàng"
                    optional
                  />
                  <Input
                    placeholder="Lưu ý cho người bán hoặc shipper (tuỳ chọn)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ============ Sidebar ============ */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[100px] space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-2xl border-muted/60 overflow-hidden">
                  <CardContent className="p-5 sm:p-6">
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Chi tiết thanh toán
                    </h3>

                    {/* Free shipping progress */}
                    {shippingFee > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60">
                        <div className="flex items-start gap-2">
                          <Truck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="flex-1 text-xs">
                            <p className="text-amber-800 dark:text-amber-300 font-medium">
                              Mua thêm {formatPrice(amountToFreeShipping)} để được{' '}
                              <span className="font-bold">FREESHIP</span>
                            </p>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-amber-200 dark:bg-amber-900/60 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (subtotal / 500000) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tạm tính ({items.length} sản phẩm)
                        </span>
                        <span className="font-medium">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" />
                          Phí vận chuyển
                        </span>
                        {shippingFee === 0 ? (
                          <span className="text-emerald-600 font-medium line-through-with-free">
                            <span className="line-through text-muted-foreground/60 mr-1.5 text-xs">
                              {formatPrice(30000)}
                            </span>
                            Miễn phí
                          </span>
                        ) : (
                          <span>{formatPrice(shippingFee)}</span>
                        )}
                      </div>
                      {voucherDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            Giảm giá
                          </span>
                          <span className="text-emerald-600 font-medium">
                            -{formatPrice(voucherDiscount)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-semibold">Tổng cộng</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(total - voucherDiscount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Đã bao gồm VAT</p>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full rounded-xl h-12 mt-4 gap-2 text-base font-semibold"
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting || items.length === 0 || !selectedAddress}
                    >
                      {isSubmitting ? (
                        <>
                          <Lock className="h-4 w-4 animate-pulse" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Đặt hàng
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
                      Bằng việc đặt hàng, bạn đồng ý với{' '}
                      <Link to="/terms" className="text-primary hover:underline">
                        Điều khoản dịch vụ
                      </Link>{' '}
                      của Farmer Vietnam.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                <TrustBadge icon={<ShieldCheck />} label="Bảo mật SSL" />
                <TrustBadge icon={<Truck />} label="Giao 24h" />
                <TrustBadge icon={<CheckCircle2 />} label="Đổi trả 7 ngày" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Chọn địa chỉ giao hàng
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 py-2 max-h-80 overflow-y-auto">
            {savedAddresses.map((addr) => {
              const active = selectedAddress?.id === addr.id;
              return (
                <button
                  key={addr.id}
                  type="button"
                  className={`w-full p-3.5 rounded-xl border-2 cursor-pointer transition-all text-left ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                  onClick={() => {
                    setSelectedAddress(addr);
                    setAddressDialogOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{addr.fullName}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs text-muted-foreground">{addr.phone}</span>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {addr.addressType === 'OFFICE' ? 'Văn phòng' : 'Nhà riêng'}
                    </Badge>
                    {addr.isDefault && (
                      <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-600">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {addr.addressLine}
                    {addr.district ? `, ${addr.district}` : ''}, {addr.province}
                  </p>
                </button>
              );
            })}
            <Link
              to="/profile"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              onClick={() => setAddressDialogOpen(false)}
            >
              <Plus className="h-4 w-4" />
              Thêm địa chỉ mới
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === current;
        const isDone = i < current;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : isDone
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-4 sm:w-6 ${
                  isDone ? 'bg-emerald-500' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  action,
  optional,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="flex items-center gap-2 font-bold text-base">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">
            (Tuỳ chọn)
          </span>
        )}
      </h3>
      {action}
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card text-center">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </div>
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </div>
  );
}
