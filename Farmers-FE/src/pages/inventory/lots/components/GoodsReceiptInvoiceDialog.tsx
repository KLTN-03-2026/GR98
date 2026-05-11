import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import type { InventoryLot } from '../api/types';
import {
  RECEIPT_CONDITION_LABEL,
  type ReceiptMetadata,
} from './receipt-metadata';

interface GoodsReceiptInvoiceDialogProps {
  /** Lô hàng cần in phiếu — bắt buộc có quan hệ contract + warehouse + product. */
  lot: InventoryLot;
  /** Metadata phiếu nhập kho đã decode từ note của giao dịch RECEIPT. */
  receipt: ReceiptMetadata;
  /** Khối lượng thực nhập tại thời điểm tạo phiếu (lấy từ transaction). */
  actualWeight: number;
  isOpen: boolean;
  onClose: () => void;
}

export function GoodsReceiptInvoiceDialog({
  lot,
  receipt,
  actualWeight,
  isOpen,
  onClose,
}: GoodsReceiptInvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const expected = lot.quantityKg;
  const deviation = actualWeight - expected;
  const deviationPercent = expected > 0 ? (Math.abs(deviation) / expected) * 100 : 0;

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);

    const clone = invoiceRef.current.cloneNode(true) as HTMLDivElement;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.appendChild(clone);
    document.body.appendChild(container);

    await new Promise((r) => setTimeout(r, 300));

    try {
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`phieu-nhap-kho-${receipt.receiptNo}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      toast.error('Tải PDF thất bại. Vui lòng thử lại.');
    } finally {
      if (document.body.contains(container)) document.body.removeChild(container);
      setIsExporting(false);
    }
  };

  const conditionLabel = RECEIPT_CONDITION_LABEL[receipt.condition];
  const receivedAt = new Date(receipt.receivedAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[860px] max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-8 pt-6 pb-2">
          <DialogTitle>Phiếu nhập kho</DialogTitle>
          <DialogDescription>Số phiếu: {receipt.receiptNo}</DialogDescription>
        </DialogHeader>

        <div
          ref={invoiceRef}
          style={{
            backgroundColor: '#ffffff',
            padding: '0 32px 24px',
            color: '#1e293b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #1e293b',
              paddingBottom: '20px',
              marginBottom: '24px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.025em',
                }}
              >
                PHIẾU NHẬP KHO
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                Số phiếu:{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                  {receipt.receiptNo}
                </span>
              </p>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                Ngày nhập: {format(receivedAt, 'HH:mm - dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '9999px',
                  border: '1px solid #d1fae5',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#047857',
                  backgroundColor: '#ecfdf5',
                }}
              >
                Đã nhập kho
              </span>
            </div>
          </div>

          {/* Bên giao & Bên nhận */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              fontSize: '14px',
              marginBottom: '24px',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '8px',
                }}
              >
                Bên giao
              </p>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px', margin: 0 }}>
                {receipt.deliverer.name || lot.contract?.farmer?.fullName || '—'}
              </p>
              {receipt.deliverer.phone && (
                <p style={{ color: '#475569', marginTop: '4px' }}>{receipt.deliverer.phone}</p>
              )}
              {lot.contract?.farmer?.fullName &&
                receipt.deliverer.name !== lot.contract.farmer.fullName && (
                  <p style={{ color: '#64748b', marginTop: '4px', fontSize: '12px' }}>
                    Đại diện cho Nông Dân:{' '}
                    <span style={{ fontWeight: 600 }}>{lot.contract.farmer.fullName}</span>
                  </p>
                )}
              {receipt.vehiclePlate && (
                <p style={{ color: '#64748b', marginTop: '6px', fontSize: '12px' }}>
                  Biển số xe:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                    {receipt.vehiclePlate}
                  </span>
                </p>
              )}
              {receipt.invoiceNo && (
                <p style={{ color: '#64748b', marginTop: '4px', fontSize: '12px' }}>
                  Số hoá đơn/phiếu giao:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                    {receipt.invoiceNo}
                  </span>
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '8px',
                }}
              >
                Bên nhận
              </p>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px', margin: 0 }}>
                {lot.warehouse.name}
              </p>
              {lot.warehouse.locationAddress && (
                <p style={{ color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}>
                  {lot.warehouse.locationAddress}
                </p>
              )}
            </div>
          </div>

          {/* Hợp đồng */}
          {lot.contract && (
            <div
              style={{
                marginBottom: '24px',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '6px',
                }}
              >
                Hợp đồng tham chiếu
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Số HĐ: </span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {lot.contract.contractNo}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Lô đất: </span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {lot.contract.plot?.plotCode}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Loại cây: </span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {lot.contract.plot?.cropType}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bảng hàng hoá */}
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                marginBottom: '12px',
              }}
            >
              Hàng hoá nhập kho
            </p>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 8px 12px 0',
                      fontWeight: 700,
                      color: '#1e293b',
                      width: '36%',
                    }}
                  >
                    Sản phẩm
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      fontWeight: 700,
                      color: '#1e293b',
                    }}
                  >
                    Dự kiến
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      fontWeight: 700,
                      color: '#1e293b',
                    }}
                  >
                    Thực nhập
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      fontWeight: 700,
                      color: '#1e293b',
                    }}
                  >
                    Chênh lệch
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px 0 12px 8px',
                      fontWeight: 700,
                      color: '#1e293b',
                    }}
                  >
                    Phẩm cấp
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '14px 8px 14px 0', color: '#1e293b' }}>
                    <div style={{ fontWeight: 600 }}>{lot.product.name}</div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        fontFamily: 'monospace',
                        marginTop: '2px',
                      }}
                    >
                      SKU: {lot.product.sku}
                    </div>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', color: '#475569' }}>
                    {expected.toLocaleString('vi-VN')} kg
                  </td>
                  <td
                    style={{
                      padding: '14px 8px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {actualWeight.toLocaleString('vi-VN')} kg
                  </td>
                  <td
                    style={{
                      padding: '14px 8px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: deviation === 0 ? '#64748b' : deviation > 0 ? '#059669' : '#dc2626',
                    }}
                  >
                    {deviation === 0
                      ? '—'
                      : `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)} kg (${deviationPercent.toFixed(1)}%)`}
                  </td>
                  <td
                    style={{
                      padding: '14px 0 14px 8px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {lot.qualityGrade === 'REJECT' ? 'REJECT' : `Loại ${lot.qualityGrade}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kiểm phẩm */}
          <div
            style={{
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              fontSize: '13px',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fafafa',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '4px',
                }}
              >
                Tình trạng cảm quan
              </p>
              <p
                style={{
                  fontWeight: 700,
                  color:
                    receipt.condition === 'OK'
                      ? '#047857'
                      : receipt.condition === 'WARN'
                        ? '#b45309'
                        : '#b91c1c',
                  margin: 0,
                }}
              >
                {conditionLabel}
              </p>
            </div>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fafafa',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '4px',
                }}
              >
                Ngày thu hoạch
              </p>
              <p style={{ fontWeight: 600, color: '#334155', margin: 0 }}>
                {lot.harvestDate ? format(new Date(lot.harvestDate), 'dd/MM/yyyy') : '—'}
              </p>
            </div>
          </div>

          {/* Ghi chú */}
          {receipt.comment && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  color: '#92400e',
                  marginBottom: '4px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Ghi chú
              </p>
              <p style={{ color: '#78350f', fontStyle: 'italic', margin: 0 }}>{receipt.comment}</p>
            </div>
          )}

          {/* Ảnh đính kèm */}
          {receipt.photos.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '8px',
                }}
              >
                Ảnh đính kèm ({receipt.photos.length})
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >
                {receipt.photos.map((url) => (
                  <div
                    key={url}
                    style={{
                      aspectRatio: '1 / 1',
                      overflow: 'hidden',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chữ ký */}
          <div
            style={{
              marginTop: '32px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '48px',
              fontSize: '13px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#334155',
                  marginBottom: '4px',
                }}
              >
                Người giao
              </p>
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8', margin: 0 }}>
                (Ký, ghi rõ họ tên)
              </p>
              <div style={{ height: '60px' }} />
              <p style={{ fontWeight: 600, color: '#334155', margin: 0 }}>
                {receipt.deliverer.name || '—'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#334155',
                  marginBottom: '4px',
                }}
              >
                Người nhận (Thủ kho)
              </p>
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8', margin: 0 }}>
                (Ký, ghi rõ họ tên)
              </p>
              <div style={{ height: '60px' }} />
              <p style={{ fontWeight: 600, color: '#334155', margin: 0 }}>—</p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '32px',
              paddingTop: '16px',
              borderTop: '1px dashed #cbd5e1',
            }}
          >
            <p style={{ margin: 0 }}>
              Phiếu nhập kho là chứng từ nội bộ phục vụ đối chiếu và lưu trữ.
            </p>
          </div>
        </div>

        <DialogFooter className="px-8 pb-6 pt-2 gap-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isExporting ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            Tải PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
