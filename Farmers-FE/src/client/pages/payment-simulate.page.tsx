import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiPost } from '@/client/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Trang giả lập cổng thanh toán VNPay/MoMo.
 * User bấm "Thanh toán thành công" hoặc "Thất bại" để giả lập callback.
 */
export default function PaymentSimulatePage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const orderId = search.get('orderId') ?? '';
  const method = search.get('method') ?? 'VNPAY';
  const amount = parseFloat(search.get('amount') ?? '0');
  const ref = search.get('ref') ?? '';

  const [loading, setLoading] = useState<'success' | 'fail' | null>(null);

  const handleResult = async (result: 'SUCCESS' | 'FAILED') => {
    if (!orderId) {
      toast.error('Thiếu orderId');
      return;
    }
    setLoading(result === 'SUCCESS' ? 'success' : 'fail');
    try {
      await apiPost('/payment/simulate', { orderId, result });
      if (result === 'SUCCESS') {
        toast.success('Thanh toán thành công');
        navigate(`/orders`);
      } else {
        toast.error('Thanh toán thất bại');
        navigate('/orders');
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Lỗi xử lý thanh toán';
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-background min-h-screen pt-[110px] pb-16">
      <div className="container mx-auto px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Cổng thanh toán {method} (giả lập)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã tham chiếu</span>
                  <span className="font-mono">{ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đơn hàng</span>
                  <span className="font-mono">{orderId.slice(-8)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Số tiền</span>
                  <span className="text-primary">{formatPrice(amount)}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Đây là trang giả lập. Trong môi trường production, đây sẽ là trang
                cổng thanh toán thật của VNPay/MoMo. Chọn kết quả bên dưới để mô
                phỏng callback.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  size="lg"
                  className="w-full rounded-xl"
                  onClick={() => handleResult('SUCCESS')}
                  disabled={loading !== null}
                >
                  {loading === 'success' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Thanh toán thành công
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full rounded-xl"
                  onClick={() => handleResult('FAILED')}
                  disabled={loading !== null}
                >
                  {loading === 'fail' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Hủy / Thanh toán thất bại
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/orders">Quay về đơn hàng của tôi</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
