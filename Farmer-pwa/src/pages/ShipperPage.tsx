import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Image,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  Truck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import {
  fetchMyShipperOrders,
  markShipperOrderDelivered,
  updateShipperLocation,
  uploadDeliveryProof,
  type ShipperOrder,
  type ShipperOrderStatus,
} from '../services/shipper';
import PwaPageHeader from '../components/PwaPageHeader';
import PwaTabMenu from '../components/PwaTabMenu';

const statusTabs: Array<{
  value: ShipperOrderStatus;
  label: string;
  icon: typeof Package;
}> = [
  { value: 'SHIPPED', label: 'Cần giao', icon: Navigation },
  { value: 'DELIVERED', label: 'Hoàn tất', icon: ClipboardCheck },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
  return axiosError.response?.data?.message || axiosError.message || fallback;
}

function OrderCard({
  order,
  onDelivered,
}: {
  order: ShipperOrder;
  onDelivered: (orderId: string, proofFile: File | null, note: string) => Promise<void>;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const isDelivered = order.fulfillStatus === 'DELIVERED';
  const itemCount = order.orderItems.length;

  const coverImage = useMemo(() => {
    const product = order.orderItems[0]?.product;
    return product?.thumbnailUrl || product?.imageUrls?.[0] || null;
  }, [order.orderItems]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError('');
    try {
      await onDelivered(order.id, proofFile, note);
      setProofFile(null);
      setNote('');
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể cập nhật đơn hàng.'));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-neutral-100 p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-primary/10">
          {coverImage ? (
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-7 w-7 text-primary" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold text-neutral-900">{order.orderNo}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {itemCount} mặt hàng · {formatDate(order.shippedAt)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isDelivered
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isDelivered ? 'Đã giao' : 'Đang giao'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold text-primary">
            <Wallet className="h-4 w-4" />
            {formatPrice(order.total)}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-2xl bg-neutral-50 p-3">
          <div className="flex items-center gap-2 font-semibold text-neutral-900">
            <UserRound className="h-4 w-4 text-secondary" />
            <span className="truncate">{order.shippingAddr.fullName}</span>
          </div>
          <a
            href={`tel:${order.shippingAddr.phone}`}
            className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Phone className="h-4 w-4" />
            {order.shippingAddr.phone}
          </a>
          <div className="mt-2 flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <span>
              {order.shippingAddr.addressLine}
              {order.shippingAddr.district ? `, ${order.shippingAddr.district}` : ''},{' '}
              {order.shippingAddr.province}
            </span>
          </div>
        </section>

        <section className="space-y-2">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-neutral-600">
                {item.nameSnapshot} · {item.quantityKg}kg
              </span>
              <span className="shrink-0 font-semibold text-neutral-900">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))}
        </section>

        {isDelivered ? (
          <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Hoàn tất lúc {formatDate(order.deliveredAt)}
            </div>
            {order.deliveryProofUrl && (
              <a
                href={order.deliveryProofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 font-medium underline underline-offset-4"
              >
                <Image className="h-4 w-4" />
                Xem ảnh xác nhận
              </a>
            )}
          </div>
        ) : (
          <section className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span className="truncate">
                  {proofFile ? proofFile.name : 'Thêm ảnh giao hàng'}
                </span>
              </span>
              {proofFile && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setProofFile(null);
                  }}
                  className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chú nhanh nếu cần"
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {error && (
              <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConfirming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {isConfirming ? 'Đang xác nhận...' : 'Xác nhận đã giao'}
            </button>
          </section>
        )}
      </div>
    </article>
  );
}

export default function ShipperPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<ShipperOrderStatus>('SHIPPED');
  const [orders, setOrders] = useState<ShipperOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'ok' | 'blocked'>('idle');

  const loadOrders = useCallback(async (nextFilter = filter, quiet = false) => {
    if (quiet) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    try {
      const nextOrders = await fetchMyShipperOrders(nextFilter);
      setOrders(nextOrders);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách đơn.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadOrders(filter);
  }, [filter, loadOrders]);

  useEffect(() => {
    if (filter !== 'SHIPPED' || !('geolocation' in navigator)) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void updateShipperLocation(position.coords.latitude, position.coords.longitude)
            .then(() => setLocationStatus('ok'))
            .catch(() => setLocationStatus('blocked'));
        },
        () => setLocationStatus('blocked'),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    };

    sendLocation();
    const intervalId = window.setInterval(sendLocation, 60_000);
    return () => window.clearInterval(intervalId);
  }, [filter]);

  const activeTotal = orders.reduce((sum, order) => sum + order.total, 0);

  const handleDelivered = async (orderId: string, proofFile: File | null, note: string) => {
    let deliveryProofUrl: string | undefined;
    if (proofFile) {
      const uploaded = await uploadDeliveryProof(proofFile);
      deliveryProofUrl = uploaded.url;
    }
    await markShipperOrderDelivered({
      orderId,
      deliveryProofUrl,
      note: note.trim() || undefined,
    });
    await loadOrders(filter, true);
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-24 text-neutral-900">
      <PwaPageHeader
        title="Lộ trình giao hàng"
        subtitle={user?.fullName ?? 'Nhân viên giao hàng'}
        icon={Truck}
        tone="dark"
        onRefresh={() => void loadOrders(filter, true)}
        isRefreshing={isRefreshing}
        showLogout
      />

      <main className="mx-auto max-w-lg px-4 py-5">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-secondary p-4 text-white shadow-sm">
            <p className="text-xs font-medium text-white/70">Số đơn</p>
            <p className="mt-1 text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-neutral-900 shadow-sm">
            <p className="text-xs font-medium text-neutral-500">Giá trị</p>
            <p className="mt-1 truncate text-lg font-bold text-primary">{formatPrice(activeTotal)}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-3xl bg-white p-1 shadow-sm">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`flex h-12 items-center justify-center gap-2 rounded-[20px] text-sm font-bold transition ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
          {locationStatus === 'ok' ? (
            <Navigation className="h-4 w-4 text-primary" />
          ) : (
            <Clock3 className="h-4 w-4 text-amber-500" />
          )}
          <span className="min-w-0 flex-1">
            {locationStatus === 'ok'
              ? 'Đang cập nhật vị trí giao hàng.'
              : 'Bật quyền vị trí để điều phối theo thời gian thực.'}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center rounded-3xl bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              {filter === 'SHIPPED' ? (
                <Package className="h-7 w-7 text-primary" />
              ) : (
                <CheckCircle2 className="h-7 w-7 text-primary" />
              )}
            </div>
            <h2 className="mt-4 font-bold text-neutral-900">
              {filter === 'SHIPPED' ? 'Chưa có đơn đang giao' : 'Chưa có đơn đã giao'}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Kéo làm mới hoặc quay lại sau khi kho gán đơn mới.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onDelivered={handleDelivered} />
            ))}
          </div>
        )}
      </main>
      <PwaTabMenu />
    </div>
  );
}
