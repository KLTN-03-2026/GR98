import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/client/lib/api-client';
import { formatPrice } from '@/lib/utils';

type VerifyResult = {
  isSuccess: boolean;
  message: string;
  orderId?: string;
  orderNo?: string;
  amount?: number;
  paymentMethod?: string;
};

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Phân biệt gateway: VNPay redirect không có `gateway` param (legacy),
    // MoMo redirect kèm `?gateway=momo` (do BE set trong redirectUrl). Có thể
    // mở rộng cho gateway khác (zalopay, vnpay-qr...) theo cùng pattern.
    const gateway = params.gateway === 'momo' ? 'momo' : 'vnpay';
    const verifyPath =
      gateway === 'momo' ? '/payment/momo/verify' : '/payment/vnpay/verify';

    apiGet<VerifyResult>(verifyPath, { params })
      .then((res) => {
        const data = (res.data as unknown as { data?: VerifyResult })?.data ?? res.data;
        setResult(data as VerifyResult);
        setStatus((data as VerifyResult).isSuccess ? 'success' : 'failed');
      })
      .catch(() => {
        setStatus('failed');
        setResult({ isSuccess: false, message: 'Không thể xác thực thanh toán. Vui lòng kiểm tra lại sau.' });
      });
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[110px]">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-lg mx-auto text-center space-y-6">
          {status === 'success' ? (
            <>
              <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-14 w-14 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Thanh Toán Thành Công!</h2>
                <p className="text-muted-foreground">{result?.message}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-14 w-14 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Thanh Toán Thất Bại</h2>
                <p className="text-muted-foreground">{result?.message}</p>
              </div>
            </>
          )}

          {result?.orderNo && (
            <div className="bg-muted/30 rounded-2xl p-6 text-left space-y-3 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <span className="font-mono font-semibold">{result.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phương thức thanh toán</span>
                <span className="font-semibold">{result.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng thanh toán</span>
                <span className="font-bold text-green-600">{formatPrice(result.amount ?? 0)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 pt-4">
            <Button asChild variant="outline">
              <Link to="/orders">Xem đơn hàng</Link>
            </Button>
            <Button asChild>
              <Link to="/">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
