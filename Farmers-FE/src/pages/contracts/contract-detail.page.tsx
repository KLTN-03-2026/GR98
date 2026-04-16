import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileText,
  Printer,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractLegalTemplate } from '@/pages/contracts/components/contract-legal-template';
import {
  PARTY_A_DOCUMENT_DEFAULTS,
  buildContractLegalViewModel,
} from '@/pages/contracts/contract-legal-view-model';
import {
  getContractStatusBadgeVariant,
  getContractStatusLabel,
  getCropBadgeVariant,
  getGradeBadgeVariant,
} from '@/pages/contracts/components/contract-ui';
import '@/pages/contracts/contract-print.css';
import {
  useApproveContract,
  useContract,
  useRejectContract,
  useSubmitContractForApproval,
  useUpdateContract,
  type CreateContractPayload,
  type QualityGrade,
} from '@/pages/admin/contracts/api';

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
}

export type ContractDetailPageProps = {
  mode: 'admin' | 'supervisor';
  listBasePath: string;
};

type DraftForm = {
  plotDraftProvince: string;
  plotDraftDistrict: string;
  plotDraftAreaHa: string;
  cropType: string;
  grade: QualityGrade;
  signedAt: string;
  harvestDue: string;
};

function toInputDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function draftToPayload(form: DraftForm): CreateContractPayload {
  return {
    plotDraftProvince: form.plotDraftProvince || undefined,
    plotDraftDistrict: form.plotDraftDistrict || undefined,
    plotDraftAreaHa: form.plotDraftAreaHa ? Number(form.plotDraftAreaHa) : undefined,
    cropType: form.cropType.trim(),
    grade: form.grade,
    signedAt: form.signedAt || undefined,
    harvestDue: form.harvestDue || undefined,
  };
}

export default function ContractDetailPage({ mode, listBasePath }: ContractDetailPageProps) {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, error, refetch } = useContract(id);
  const [draftForm, setDraftForm] = useState<DraftForm | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const submitMutation = useSubmitContractForApproval();
  const approveMutation = useApproveContract();
  const rejectMutation = useRejectContract();
  const updateMutation = useUpdateContract();
  const isSaving =
    submitMutation.isPending || approveMutation.isPending || rejectMutation.isPending || updateMutation.isPending;

  const vm = useMemo(() => (contract ? buildContractLegalViewModel(contract) : null), [contract]);

  useEffect(() => {
    if (!contract || contract.status !== 'DRAFT') {
      setDraftForm(null);
      return;
    }
    setDraftForm({
      plotDraftProvince: contract.plotDraftProvince ?? '',
      plotDraftDistrict: contract.plotDraftDistrict ?? '',
      plotDraftAreaHa: String(contract.plotDraftAreaHa ?? ''),
      cropType: contract.cropType,
      grade: contract.grade,
      signedAt: toInputDate(contract.signedAt),
      harvestDue: toInputDate(contract.harvestDue),
    });
    setDraftError(null);
  }, [contract]);

  const handlePrintPdf = () => {
    window.print();
  };

  const saveDraft = async () => {
    if (!contract || !draftForm) return;
    const err =
      !draftForm.plotDraftProvince.trim()
        ? 'Nhập Tỉnh/Thành của lô đất'
        : !draftForm.plotDraftDistrict.trim()
          ? 'Nhập Quận/Huyện của lô đất'
          : !draftForm.plotDraftAreaHa || Number(draftForm.plotDraftAreaHa) <= 0
        ? 'Diện tích chuẩn không hợp lệ'
        : !draftForm.cropType.trim()
          ? 'Nhập loại cây'
          : null;
    if (err) {
      setDraftError(err);
      return;
    }
    setDraftError(null);
    await updateMutation.mutateAsync({ id: contract.id, data: draftToPayload(draftForm) });
    void refetch();
  };

  const persistSignatureFromFile = async (file: File) => {
    if (!contract || mode !== 'supervisor' || contract.status !== 'DRAFT') return;
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Không thể đọc file'));
      reader.readAsDataURL(file);
    });
    await updateMutation.mutateAsync({ id: contract.id, data: { signatureUrl: base64 } });
    void refetch();
  };

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Thiếu mã hợp đồng.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate(listBasePath)}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-col gap-4 p-4 pb-12 sm:p-6 sm:pb-16">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contract || !vm) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          {(error as Error)?.message || 'Không tải được hợp đồng.'}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => navigate(listBasePath)}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: mode === 'admin' ? 'Quản trị' : 'Giám sát', href: mode === 'admin' ? '/dashboard' : '/supervisor' },
    { label: 'Hợp đồng', href: listBasePath },
    { label: contract.contractNo },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4 pb-12 sm:p-6 sm:pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" asChild>
              <Link to={listBasePath}>
                <ArrowLeft className="h-4 w-4" />
                Danh sách
              </Link>
            </Button>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Chi tiết hợp đồng
            </h1>
            <Badge variant={getContractStatusBadgeVariant(contract.status)}>
              {getContractStatusLabel(contract.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {contract.contractNo} — {contract.farmer.fullName}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={getCropBadgeVariant(contract.cropType)}>{contract.cropType}</Badge>
            <Badge variant={getGradeBadgeVariant(contract.grade)}>Grade {contract.grade}</Badge>
            <Badge variant="outline">Diện tích chuẩn: {contract.plotDraftAreaHa ?? '—'} ha</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handlePrintPdf}>
            <Printer className="h-4 w-4" />
            In / Xuất PDF
          </Button>
          {mode === 'supervisor' && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={
                  contract.status !== 'DRAFT' || !contract.signatureUrl?.trim() || isSaving
                }
                onClick={() => void submitMutation.mutateAsync(contract.id).then(() => refetch())}
              >
                <FileCheck2 className="h-4 w-4" />
                Gửi phê duyệt
              </Button>
            </>
          )}
          {mode === 'admin' && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={contract.status !== 'SIGNED' || isSaving}
                onClick={() => void approveMutation.mutateAsync(contract.id).then(() => refetch())}
              >
                <CheckCircle2 className="h-4 w-4" />
                Phê duyệt
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={contract.status !== 'SIGNED' || isSaving}
                onClick={() => {
                  const reason = window.prompt('Nhập lý do từ chối hợp đồng');
                  if (!reason?.trim()) return;
                  void rejectMutation
                    .mutateAsync({ id: contract.id, data: { rejectedReason: reason.trim() } })
                    .then(() => refetch());
                }}
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Tóm tắt
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">Số HĐ</span>
              <span className="font-medium">{contract.contractNo}</span>
              <span className="text-muted-foreground">Ngày tạo</span>
              <span className="font-medium">{formatDate(contract.createdAt)}</span>
              <span className="text-muted-foreground">Grade</span>
              <span className="font-medium">{contract.grade}</span>
              <span className="text-muted-foreground">Diện tích chuẩn</span>
              <span className="font-medium">{contract.plotDraftAreaHa ?? '—'} ha</span>
              <span className="text-muted-foreground">Gửi duyệt</span>
              <span className="font-medium">{formatDate(contract.submittedAt)}</span>
            </div>
            {contract.rejectedReason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                Lý do từ chối: {contract.rejectedReason}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bên tham gia</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Bên A (đơn vị)</p>
              <p className="font-medium">{PARTY_A_DOCUMENT_DEFAULTS.companyName}</p>
              <p className="text-xs text-muted-foreground">
                MST: {PARTY_A_DOCUMENT_DEFAULTS.taxCode} · {PARTY_A_DOCUMENT_DEFAULTS.bankPlace}
              </p>
              <p className="text-xs text-muted-foreground">
                Đại diện: {PARTY_A_DOCUMENT_DEFAULTS.legalRepresentative}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Supervisor</p>
              <p className="font-medium">{contract.supervisor.fullName ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Mã hồ sơ: {contract.supervisorId}</p>
              <p className="text-xs text-muted-foreground">
                Mã nhân viên: {contract.supervisor.employeeCode || '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                Email: {contract.supervisor.email || '—'} · SĐT: {contract.supervisor.phone || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Bên B — Nông dân</p>
              <p className="font-medium">{contract.farmer.fullName}</p>
              <p className="text-xs text-muted-foreground">
                SĐT: {contract.farmer.phone} · CCCD: {contract.farmer.cccd}
              </p>
              <p className="text-xs text-muted-foreground">
                Địa chỉ: {contract.farmer.address || 'Chưa cập nhật'}
                {contract.farmer.province ? ` · ${contract.farmer.province}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                NH: {contract.farmer.bankName || '—'} · CN: {contract.farmer.bankBranch || '—'} · STK:{' '}
                {contract.farmer.bankAccount || 'Chưa cập nhật'}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="soft-success">HĐ: {contract.contractNo}</Badge>
                <Badge variant="soft-info">
                  Diện tích chuẩn: {contract.plotDraftAreaHa ?? '—'} ha
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Lô đất</p>
              <p className="font-medium">{contract.plot.plotCode}</p>
              <p className="text-xs text-muted-foreground">
                {contract.plot.areaHa} ha · {contract.plot.province ?? ''}{' '}
                {contract.plot.district ?? ''}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant={getCropBadgeVariant(contract.plot.cropType)}>
                  {contract.plot.cropType}
                </Badge>
                <Badge variant="outline-success">
                  {contract.plot.areaHa.toLocaleString('vi-VN')} ha
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nội dung hợp đồng (mẫu pháp lý)</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[min(70vh,720px)] overflow-y-auto rounded-md border bg-white p-4 sm:p-6">
          <div id="contract-print-root">
            <ContractLegalTemplate vm={vm} />
          </div>
        </CardContent>
      </Card>

      {mode === 'supervisor' && contract.status === 'DRAFT' && draftForm && (
        <Card className="border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chỉnh sửa hợp đồng nháp</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tỉnh / thành (nháp)</Label>
              <Input
                value={draftForm.plotDraftProvince}
                onChange={(e) =>
                  setDraftForm((prev) =>
                    prev ? { ...prev, plotDraftProvince: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Quận / huyện (nháp)</Label>
              <Input
                value={draftForm.plotDraftDistrict}
                onChange={(e) =>
                  setDraftForm((prev) =>
                    prev ? { ...prev, plotDraftDistrict: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Diện tích chuẩn (ha)</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={draftForm.plotDraftAreaHa}
                onChange={(e) =>
                  setDraftForm((prev) =>
                    prev ? { ...prev, plotDraftAreaHa: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Loại cây</Label>
              <Input
                value={draftForm.cropType}
                onChange={(e) =>
                  setDraftForm((prev) => (prev ? { ...prev, cropType: e.target.value } : prev))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <select
                value={draftForm.grade}
                onChange={(e) =>
                  setDraftForm((prev) =>
                    prev ? { ...prev, grade: e.target.value as QualityGrade } : prev,
                  )
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ngày ký</Label>
              <Input
                type="date"
                value={draftForm.signedAt}
                onChange={(e) =>
                  setDraftForm((prev) => (prev ? { ...prev, signedAt: e.target.value } : prev))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc hợp đồng</Label>
              <Input
                type="date"
                value={draftForm.harvestDue}
                onChange={(e) =>
                  setDraftForm((prev) => (prev ? { ...prev, harvestDue: e.target.value } : prev))
                }
              />
            </div>
            {draftError && (
              <p className="text-sm text-destructive sm:col-span-2">{draftError}</p>
            )}
            <div className="sm:col-span-2">
              <Button type="button" onClick={() => void saveDraft()} disabled={isSaving}>
                Lưu thay đổi nháp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">QR truy xuất</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4 text-sm">
            {contract.traceabilityQr ? (
              <>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(contract.traceabilityQr)}`}
                  alt="QR"
                  className="h-28 w-28 border"
                />
                <p className="max-w-md break-all text-xs text-muted-foreground">{contract.traceabilityQr}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu QR.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ảnh xác nhận bản cứng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contract.signatureUrl ? (
              <img
                src={contract.signatureUrl}
                alt="Ảnh hợp đồng"
                className="max-h-64 w-full rounded-md border object-contain bg-muted/30"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có ảnh xác nhận.</p>
            )}
            {mode === 'supervisor' && contract.status === 'DRAFT' && (
              <div className="space-y-1">
                <Label className="text-xs">Tải / cập nhật ảnh</Label>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isSaving}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await persistSignatureFromFile(file);
                    } catch {
                      /* hook toast */
                    }
                    e.target.value = '';
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
