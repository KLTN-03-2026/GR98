import type {
  ContractResponse,
  QualityGrade,
} from '@/pages/admin/contracts/api/types';
import type { FarmerResponse } from '@/pages/admin/farmers/api/types';
import type { PlotResponse } from '@/pages/admin/plots/api/types';

/** Dữ liệu hiển thị cho mẫu hợp đồng pháp lý + in PDF */
export type ContractLegalViewModel = {
  contractNo: string;
  contractId: string;
  versionLabel: string;
  companyName: string;
  legalRepresentative: string;
  companyBank: string;
  companyBankPlace: string;
  supervisorId: string;
  supervisorName: string;
  farmerName: string;
  farmerCccd: string;
  farmerPhone: string;
  plotGisId: string;
  plotCode: string;
  areaM2: string;
  cropType: string;
  quantityKg: string;
  floorPricePerKg: string;
  materialDebtVnd: string;
  termLabel: string;
  termFromTo: string;
  grade: string;
  signedAtLine: string;
  harvestDueLine: string;
  createdAtLine: string;
  /** Mở đầu “Hôm nay, …” — ví dụ ngày 15 tháng 4 năm 2026 */
  preambleTodayPart: string;
  /** Địa điểm gặp gỡ / ký */
  preamblePlacePart: string;
  /** Điều 1.2: từ ngày … đến hết ngày … */
  termStartPart: string;
  termEndPart: string;
  /** Chân trang: ngày ký */
  footerSignDatePart: string;
};

function formatDateVi(value?: string | null) {
  if (!value) return '……/……/……';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '……/……/……';
  return d.toLocaleDateString('vi-VN');
}

/** Định dạng “ngày d tháng m năm y” cho văn bản pháp lý */
function formatDateViLong(value?: string | null, fallback = '…… tháng …… năm ……') {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

/** Ngày hiện tại theo hệ thống máy người dùng (dùng cho phần mở đầu văn bản) */
function formatTodayViLong() {
  const now = new Date();
  return `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}

/** Bên A khi chưa có đủ dữ liệu tenant — hiển thị kiểu “bản giấy” có tên gợi ý */
export const PARTY_A_DOCUMENT_DEFAULTS = {
  companyName: 'Công ty Cổ phần Liên kết Nông nghiệp Xanh',
  legalRepresentative: 'Ông Nguyễn Văn An',
  taxCode: '6001234567',
  bank: '0123 456 789 tại BIDV Chi nhánh Đắk Lắk',
  bankPlace: 'TP. Buôn Ma Thuột, Đắk Lắk',
} as const;

function getPartyADocumentProfile() {
  return {
    companyName: PARTY_A_DOCUMENT_DEFAULTS.companyName,
    legalRepresentative: PARTY_A_DOCUMENT_DEFAULTS.legalRepresentative,
    companyBank: PARTY_A_DOCUMENT_DEFAULTS.bank,
    companyBankPlace: PARTY_A_DOCUMENT_DEFAULTS.bankPlace,
    taxCode: PARTY_A_DOCUMENT_DEFAULTS.taxCode,
  };
}

export function buildContractLegalViewModel(c: ContractResponse): ContractLegalViewModel {
  const areaM2 = Number.isFinite(c.plot.areaHa)
    ? (c.plot.areaHa * 10_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
    : '………………';

  const partyA = getPartyADocumentProfile();

  const preambleToday = formatTodayViLong();
  const preamblePlace = 'tại ........................................';
  const termStart = formatDateViLong(c.signedAt, '…… tháng …… năm ……');
  const termEnd = formatDateViLong(c.harvestDue, '…… tháng …… năm ……');
  const footerSign = formatDateViLong(c.signedAt, formatTodayViLong());

  return {
    contractNo: c.contractNo,
    contractId: c.id,
    versionLabel: 'Phiên bản 4.0 (Consolidated)',
    companyName: partyA.companyName,
    legalRepresentative: partyA.legalRepresentative,
    companyBank: partyA.companyBank,
    companyBankPlace: partyA.companyBankPlace,
    supervisorId: c.supervisorId,
    supervisorName: c.supervisor.fullName?.trim() || '…………………………',
    farmerName: c.farmer.fullName,
    farmerCccd: c.farmer.cccd || '…………………………',
    farmerPhone: c.farmer.phone || '…………………………',
    plotGisId: c.plot.id,
    plotCode: c.plot.plotCode,
    areaM2,
    cropType: c.cropType,
    quantityKg: c.quantityKg.toLocaleString('vi-VN'),
    floorPricePerKg: c.pricePerKg.toLocaleString('vi-VN'),
    materialDebtVnd: 'Chưa khai báo trên hệ thống',
    termLabel: 'Theo thời hạn ghi nhận trên hệ thống / thỏa thuận bổ sung',
    termFromTo: `${formatDateVi(c.signedAt)} — ${formatDateVi(c.harvestDue)}`,
    grade: c.grade,
    signedAtLine: formatDateVi(c.signedAt),
    harvestDueLine: formatDateVi(c.harvestDue),
    createdAtLine: formatDateVi(c.createdAt),
    preambleTodayPart: preambleToday,
    preamblePlacePart: preamblePlace,
    termStartPart: termStart,
    termEndPart: termEnd,
    footerSignDatePart: footerSign,
  };
}

export type DraftLegalFormInput = {
  cropType: string;
  quantityKg: string;
  pricePerKg: string;
  grade: QualityGrade;
  signedAt: string;
  harvestDue: string;
};

type DraftFarmerPreview = Pick<
  FarmerResponse,
  'fullName' | 'phone' | 'cccd' | 'province' | 'address' | 'bankAccount'
>;

/** View-model khi tạo nháp (chưa lưu) — đủ số liệu để in xem trước */
export function buildContractLegalViewModelFromDraft(input: {
  me: unknown;
  supervisorProfileId: string;
  supervisorName: string;
  farmer: DraftFarmerPreview | null;
  plot: PlotResponse | null;
  form: DraftLegalFormInput;
}): ContractLegalViewModel {
  const partyA = getPartyADocumentProfile();
  const qty = Number(input.form.quantityKg);
  const price = Number(input.form.pricePerKg);
  const qtyStr = Number.isFinite(qty) && qty > 0 ? qty.toLocaleString('vi-VN') : '—';
  const priceStr = Number.isFinite(price) && price >= 0 ? price.toLocaleString('vi-VN') : '—';

  const areaHa =
    input.plot && typeof input.plot.areaHa === 'number' && Number.isFinite(input.plot.areaHa)
      ? input.plot.areaHa
      : null;
  const areaM2 =
    areaHa !== null
      ? (areaHa * 10_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
      : '—';

  const signed = input.form.signedAt || undefined;
  const harvest = input.form.harvestDue || undefined;
  const preambleToday = formatTodayViLong();
  const preamblePlace = 'tại ........................................';

  return {
    contractNo: 'BẢN NHÁP',
    contractId: '—',
    versionLabel: 'Xem trước (chưa lưu)',
    companyName: partyA.companyName,
    legalRepresentative: partyA.legalRepresentative,
    companyBank: partyA.companyBank,
    companyBankPlace: partyA.companyBankPlace,
    supervisorId: input.supervisorProfileId,
    supervisorName: input.supervisorName.trim() || '—',
    farmerName: input.farmer?.fullName?.trim() || '—',
    farmerCccd: input.farmer?.cccd?.trim() || '—',
    farmerPhone: input.farmer?.phone?.trim() || '—',
    plotGisId: input.plot?.id ?? '—',
    plotCode: input.plot?.lotCode?.trim() || input.plot?.plotName?.trim() || '—',
    areaM2,
    cropType: input.form.cropType.trim() || '—',
    quantityKg: qtyStr,
    floorPricePerKg: priceStr,
    materialDebtVnd: 'Chưa khai báo trên hệ thống',
    termLabel: 'Theo ngày ký và ngày kết thúc hợp đồng đã nhập',
    termFromTo: `${formatDateVi(signed || null)} — ${formatDateVi(harvest || null)}`,
    grade: input.form.grade,
    signedAtLine: formatDateVi(signed || null),
    harvestDueLine: formatDateVi(harvest || null),
    createdAtLine: '—',
    preambleTodayPart: preambleToday,
    preamblePlacePart: preamblePlace,
    termStartPart: formatDateViLong(signed, '…… tháng …… năm ……'),
    termEndPart: formatDateViLong(harvest, '…… tháng …… năm ……'),
    footerSignDatePart: formatDateViLong(signed, formatTodayViLong()),
  };
}
