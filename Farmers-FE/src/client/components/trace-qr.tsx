import { QRCodeSVG } from 'qrcode.react';

interface TraceQRProps {
  /** Slug sản phẩm — sẽ encode thành URL public /traceability/<slug>. */
  slug: string;
  /** Kích thước QR (px). Mặc định 160 — đủ rõ nét cho mobile camera. */
  size?: number;
  className?: string;
}

/**
 * Render ảnh QR encode URL truy xuất nguồn gốc công khai.
 *
 * Khi khách quét QR (in trên bao bì sản phẩm) bằng app camera bất kỳ,
 * trình duyệt sẽ mở thẳng URL /traceability/<slug> — vào trang truy xuất
 * mà không cần app riêng của hệ thống.
 *
 * Origin lấy từ `window.location.origin` (run-time) thay vì hard-code,
 * để cùng 1 build chạy được trên localhost, staging, production mà QR
 * vẫn trỏ đúng domain.
 */
export function TraceQR({ slug, size = 160, className }: TraceQRProps) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/traceability/${slug}`;

  return (
    <div className={className}>
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        marginSize={2}
        // Logo trung tâm (optional) — bỏ qua để giữ QR clean, dễ quét nhất.
      />
    </div>
  );
}
