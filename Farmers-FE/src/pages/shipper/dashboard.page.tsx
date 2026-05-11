import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  CheckCircle2,
  Package,
  Phone,
  MapPin,
  Loader2,
  RefreshCw,
  LogOut,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiGet } from '@/client/lib/api-client';
import { uploadImage } from '@/client/api/upload';
import { useMarkDelivered } from '@/client/api';
import FileUpload from '@/components/custom/file-upload';
import { useAuthStore } from '@/client/store';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useLogout } from '@/client/api';

interface ShipperOrder {
  id: string;
  orderNo: string;
  total: number;
  fulfillStatus: 'SHIPPED' | 'DELIVERED';
  shippingAddr: {
    fullName: string;
    phone: string;
    addressLine: string;
    district?: string | null;
    province: string;
  };
  shippedAt?: string;
  deliveredAt?: string | null;
  deliveryProofUrl?: string | null;
  orderItems: Array<{
    id: string;
    nameSnapshot: string;
    quantityKg: number;
    subtotal: number;
    product?: { imageUrls?: string[]; thumbnailUrl?: string | null };
  }>;
  client?: {
    user: { fullName: string; phone: string | null };
  };
}

function ShipperOrderCard({ order }: { order: ShipperOrder }) {
  const markDelivered = useMarkDelivered();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isDelivered = order.fulfillStatus === 'DELIVERED';
  const addr = order.shippingAddr;

  const handleDeliver = async () => {
    setIsUploading(true);
    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        const uploaded = await uploadImage(proofFile, 'delivery-proofs');
        proofUrl = uploaded.url;
      }
      await markDelivered.mutateAsync({
        orderId: order.id,
        deliveryProofUrl: proofUrl,
        note: note || undefined,
      });
      setOpen(false);
      setProofFile(null);
      setNote('');
    } catch {
      /* toast shown by mutation */
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold text-sm">
            {order.orderNo}
          </span>
          <Badge
            className={
              isDelivered
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800'
            }
          >
            {isDelivered ? 'Đã giao' : 'Đang giao'}
          </Badge>
        </div>

        <Separator />

        {/* Recipient */}
        <div className="space-y-1 text-sm">
          <div className="font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            {addr.fullName}
          </div>
          <a
            href={`tel:${addr.phone}`}
            className="flex items-center gap-2 text-primary"
          >
            <Phone className="h-3.5 w-3.5" />
            {addr.phone}
          </a>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {addr.addressLine}
              {addr.district ? `, ${addr.district}` : ''}, {addr.province}
            </span>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-1.5">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground line-clamp-1 flex-1 pr-2">
                {item.nameSnapshot} × {item.quantityKg}kg
              </span>
              <span className="font-medium shrink-0">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm pt-1 border-t">
          <span className="text-muted-foreground">Tổng</span>
          <span className="font-bold text-primary">
            {formatPrice(order.total)}
          </span>
        </div>

        {/* Action */}
        {!isDelivered ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-2" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Đã giao hàng
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận giao hàng</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    Ảnh chứng minh (optional)
                  </Label>
                  <FileUpload
                    onFileSelect={(file) => setProofFile(file)}
                    onFileError={(error) => {
                      toast.error(error || 'Ảnh không hợp lệ');
                    }}
                    currentFile={proofFile}
                    maxFileSize={5 * 1024 * 1024}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ghi chú (optional)</Label>
                  <Input
                    placeholder="VD: Giao tận tay người nhận"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleDeliver}
                  disabled={markDelivered.isPending || isUploading}
                >
                  {(markDelivered.isPending || isUploading) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  )}
                  {isUploading ? 'Đang upload...' : 'Xác nhận'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-xs text-muted-foreground text-center pt-1">
            Đã giao {order.deliveredAt ? `lúc ${new Date(order.deliveredAt).toLocaleString('vi-VN')}` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ShipperDashboardPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { mutate: logoutMutate } = useLogout();
  const [filter, setFilter] = useState<'SHIPPED' | 'DELIVERED'>('SHIPPED');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['shipper-me-orders', filter],
    queryFn: async () => {
      const res = await apiGet<{ data: ShipperOrder[] }>(
        `/shippers/me/orders?status=${filter}`,
      );
      return (res.data as unknown as { data?: ShipperOrder[] })?.data ?? [];
    },
  });

  // GPS tracking khi đang có đơn SHIPPED
  useEffect(() => {
    if (filter !== 'SHIPPED') return;
    if (!('geolocation' in navigator)) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await fetch(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9933/api'}/shippers/me/location`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${document.cookie
                    .split('; ')
                    .find((r) => r.startsWith('access_token='))
                    ?.split('=')[1] ?? ''}`,
                },
                body: JSON.stringify({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                }),
              },
            );
          } catch {
            /* silent */
          }
        },
        () => {
          /* denied - silent */
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    };

    updateLocation();
    const id = setInterval(updateLocation, 60_000);
    return () => clearInterval(id);
  }, [filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      {/* Top bar */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <h1 className="font-bold">Shipper Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {user?.fullName ?? 'Shipper'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                refetch();
                qc.invalidateQueries({ queryKey: ['shipper-me-orders'] });
                toast.info('Đã làm mới');
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutate()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'SHIPPED' ? 'success' : 'outline'}
            size="sm"
            onClick={() => setFilter('SHIPPED')}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-1.5" />
            Đang giao
          </Button>
          <Button
            variant={filter === 'DELIVERED' ? 'success' : 'outline'}
            size="sm"
            onClick={() => setFilter('DELIVERED')}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Đã giao
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (orders?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {filter === 'SHIPPED'
                ? 'Chưa có đơn nào được gán cho bạn.'
                : 'Chưa có đơn đã giao.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders?.map((o) => <ShipperOrderCard key={o.id} order={o} />)}
          </div>
        )}
      </main>
    </div>
  );
}

export function ShipperHomeRedirect() {
  return (
    <Card className="max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle>Shipper</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Redirect đến /shipper/orders...
        </p>
      </CardContent>
    </Card>
  );
}
