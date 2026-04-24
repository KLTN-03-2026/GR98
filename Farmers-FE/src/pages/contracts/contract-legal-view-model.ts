import type {
  ContractResponse,
  QualityGrade,
} from '@/pages/admin/contracts/api/types';

type CoordinatePair = { lat: string; lng: string };

/** Parse chuỗi coordinates thành mảng cặp lat/lng — hỗ trợ nhiều format lưu trữ */
function parseCoordinatePairs(value?: string | null): CoordinatePair[] {
  if (!value?.trim()) return [];

  const lines = value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  // Try parsing as "lat,lng" pairs per line first (correct format)
  const pairsFromLines: CoordinatePair[] = [];
  let allLinesArePairs = true;
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        pairsFromLines.push({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
        continue;
      }
    }
    allLinesArePairs = false;
    break;
  }
  if (allLinesArePairs && pairsFromLines.length > 0) return pairsFromLines;

  // Fallback: flat number list (backward compatibility with old data)
  const nums = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (nums.length < 2) return [];
  const pairs: CoordinatePair[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const lat = parseFloat(nums[i]);
    const lng = parseFloat(nums[i + 1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      pairs.push({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    }
  }
  return pairs;
}

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
  farmerAddress: string;
  farmerProvince: string;
  farmerBankName: string;
  farmerBankBranch: string;
  farmerBankAccount: string;
  plotGisId: string;
  plotCode: string;
  areaM2: string;
  plotDraftProvince: string;
  plotDraftDistrict: string;
  plotDraftAreaHa: string;
  cropType: string;
  materialDebtVnd: string;
  termLabel: string;
  termFromTo: string;
  grade: string;
  signedAtLine: string;
  harvestDueLine: string;
  createdAtLine: string;
  plotDraftCoordinatesText: string;
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

  const farmer = c.farmer;

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
    farmerName: farmer?.fullName || '…………………………',
    farmerCccd: farmer?.cccd || '…………………………',
    farmerPhone: farmer?.phone || '…………………………',
    farmerAddress: farmer?.address || '…………………………',
    farmerProvince: farmer?.province || '…………………………',
    farmerBankName: farmer?.bankName || '…………………………',
    farmerBankBranch: farmer?.bankBranch || '…………………………',
    farmerBankAccount: farmer?.bankAccount || '…………………………',
    plotGisId: c.plot.id,
    plotCode: c.plot.plotCode,
    areaM2,
    plotDraftProvince: c.plotDraftProvince || '—',
    plotDraftDistrict: c.plotDraftDistrict || '—',
    plotDraftAreaHa: c.plotDraftAreaHa ? `${c.plotDraftAreaHa} ha` : '—',
    cropType: c.cropType,
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
    plotDraftCoordinatesText: parseCoordinatePairs(c.plotDraftCoordinatesText)
      .map((p) => `${p.lat}, ${p.lng}`)
      .join('\n'),
  };
}

export type DraftLegalFormInput = {
  plotDraftProvince: string;
  plotDraftDistrict: string;
  plotDraftAreaHa: string;
  plotDraftCoordinates: Array<[string, string]>; // [lat, lng]
  cropType: string;
  grade: QualityGrade;
  signedAt: string;
  harvestDue: string;
};

type DraftFarmerPreview = {
  fullName: string;
  phone: string;
  cccd: string;
  province: string | null;
  address: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bankBranch: string | null;
};

/** View-model khi tạo nháp (chưa lưu) — đủ số liệu để in xem trước */
export function buildContractLegalViewModelFromDraft(input: {
  me: unknown;
  supervisorProfileId: string;
  supervisorName: string;
  farmer: DraftFarmerPreview | null;
  form: DraftLegalFormInput;
}): ContractLegalViewModel {
  const partyA = getPartyADocumentProfile();
  const areaHa = Number(input.form.plotDraftAreaHa);
  const areaM2 =
    Number.isFinite(areaHa) && areaHa > 0
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
    farmerAddress: input.farmer?.address?.trim() || '—',
    farmerProvince: input.farmer?.province?.trim() || '—',
    farmerBankName: input.farmer?.bankName?.trim() || '—',
    farmerBankBranch: input.farmer?.bankBranch?.trim() || '—',
    farmerBankAccount: input.farmer?.bankAccount?.trim() || '—',
    plotGisId: '—',
    plotCode: '—',
    areaM2,
    plotDraftProvince: input.form.plotDraftProvince.trim() || '—',
    plotDraftDistrict: input.form.plotDraftDistrict.trim() || '—',
    plotDraftAreaHa:
      Number.isFinite(areaHa) && areaHa > 0 ? `${areaHa.toLocaleString('vi-VN')} ha` : '—',
    cropType: input.form.cropType.trim() || '—',
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
    plotDraftCoordinatesText: input.form.plotDraftCoordinates
      .filter(([lat, lng]) => lat.trim() && lng.trim())
      .map(([lat, lng]) => `${lat.trim()},${lng.trim()}`)
      .join('\n'),
  };
}
