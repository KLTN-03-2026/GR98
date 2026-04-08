import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Banknote,
  Lock,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore } from '@/client/store';
import { formatPrice } from '@/client/data/mock-data';
import { toast } from 'sonner';
import type { ShippingAddress } from '@/client/types';

const PAYMENT_METHODS = [
  {
    value: 'COD',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Trả tiền mặt khi nhận được hàng',
    icon: Banknote,
  },
  {
    value: 'VNPAY',
    label: 'VNPay',
    description: 'Thanh toán qua ví VNPay',
    icon: Smartphone,
  },
  {
    value: 'MOMO',
    label: 'MoMo',
    description: 'Thanh toán qua ví MoMo',
    icon: Smartphone,
  },
];

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    address: '',
    province: '',
    district: '',
    ward: '',
    isDefault: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((res) => setTimeout(res, 2000));
    setIsSubmitting(false);
    clearCart();
    setStep('success');
    toast.success('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.');
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
          <p className="text-muted-foreground mb-4">Vui lòng thêm sản phẩm trước khi thanh toán.</p>
          <Button asChild>
            <Link to="/products">Mua sắm ngay</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="bg-background min-h-screen">
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
                <span className="font-mono font-semibold">EC-{Date.now().toString().slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phương thức thanh toán</span>
                <span className="font-medium">
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng thanh toán</span>
                <span className="font-bold text-primary text-lg">{formatPrice(total)}</span>
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
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Quay lại giỏ hàng
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Thanh Toán</h1>
          {/* Steps */}
          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 ${step === 'info' ? 'text-primary' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'info' ? 'bg-primary text-primary-foreground' : 'bg-green-600 text-white'
              }`}>
                {step === 'info' ? '1' : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <span className="text-sm font-medium">Thông tin giao hàng</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Thanh toán</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'info' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Thông tin giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="Nhập họ và tên"
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="0901 234 567"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ cụ thể *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Số nhà, đường, phường/xã"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="province">Tỉnh/Thành phố *</Label>
                        <Input
                          id="province"
                          name="province"
                          placeholder="TP. HCM"
                          value={formData.province}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">Quận/Huyện *</Label>
                        <Input
                          id="district"
                          name="district"
                          placeholder="Quận 3"
                          value={formData.district}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ward">Phường/Xã</Label>
                        <Input
                          id="ward"
                          name="ward"
                          placeholder="Phường 5"
                          value={formData.ward}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Ghi chú đơn hàng</Label>
                      <textarea
                        id="note"
                        name="note"
                        placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)"
                        rows={3}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                    <Button
                      size="lg"
                      className="w-full rounded-xl mt-2"
                      onClick={() => setStep('payment')}
                      disabled={!formData.fullName || !formData.phone || !formData.address}
                    >
                      Tiếp tục thanh toán
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Phương thức thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      {PAYMENT_METHODS.map((method) => (
                        <Label
                          key={method.value}
                          htmlFor={method.value}
                          className="flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                        >
                          <RadioGroupItem value={method.value} id={method.value} className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <method.icon className="h-5 w-5 text-primary" />
                              <span className="font-medium">{method.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>

                    {/* Shipping Address Summary */}
                    <div className="bg-muted/30 rounded-xl p-4">
                      <h4 className="font-medium text-sm mb-2">Địa chỉ giao hàng</h4>
                      <p className="text-sm text-muted-foreground">
                        {formData.fullName} - {formData.phone}
                        <br />
                        {formData.address}, {formData.ward && `${formData.ward}, `}
                        {formData.district}, {formData.province}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 rounded-xl"
                        onClick={() => setStep('info')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Quay lại
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1 rounded-xl gap-2"
                        onClick={handleSubmitOrder}
                        isLoading={isSubmitting}
                      >
                        <Lock className="h-4 w-4" />
                        Thanh toán {formatPrice(total)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Đơn hàng của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={item.product.imageUrls[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantityKg}kg × {formatPrice(item.product.pricePerKg)}</p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(item.product.pricePerKg * item.quantityKg)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                      {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Thanh toán an toàn & bảo mật
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
