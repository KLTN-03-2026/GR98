import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Landmark,
  MapPin,
  Phone,
  Printer,
  Save,
  UserRound,
  Wheat,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe } from '@/client/api/auth/use-me';
import { useFarmers } from '@/pages/admin/farmers/api';
import { usePlots } from '@/pages/admin/plots/api';
import {
  useCreateContract,
  type CreateContractPayload,
  type QualityGrade,
} from '@/pages/admin/contracts/api';
import { usePriceBoards } from '@/pages/inventory/price-boards/api';
import ContractDetailPage from '@/pages/contracts/contract-detail.page';
import { ContractLegalTemplate } from '@/pages/contracts/components/contract-legal-template';
import {
  PARTY_A_DOCUMENT_DEFAULTS,
  buildContractLegalViewModelFromDraft,
} from '@/pages/contracts/contract-legal-view-model';
import '@/pages/contracts/contract-print.css';

type FormState = {
  plotId: string;
  priceBoardId: string;
  cropType: string;
  quantityKg: string;
  pricePerKg: string;
  grade: QualityGrade;
  signedAt: string;
  harvestDue: string;
  signatureUrl: string;
};

const defaultForm: FormState = {
  plotId: '',
  priceBoardId: '',
  cropType: '',
  quantityKg: '',
  pricePerKg: '',
  grade: 'A',
  signedAt: '',
  harvestDue: '',
  signatureUrl: '',
};

function toPayload(form: FormState, farmerId: string | undefined): CreateContractPayload {
  return {
    plotId: form.plotId,
    farmerId: farmerId || undefined,
    priceBoardId: form.priceBoardId || undefined,
    cropType: form.cropType.trim(),
    quantityKg: Number(form.quantityKg),
    pricePerKg: Number(form.pricePerKg),
    grade: form.grade,
    signedAt: form.signedAt || undefined,
    harvestDue: form.harvestDue || undefined,
    signatureUrl: form.signatureUrl.trim() || undefined,
  };
}

function SupervisorContractCreateWorkspace() {
  const navigate = useNavigate();
  const [farmerId, setFarmerId] = useState('');
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id ?? '';
  const supervisorName = me?.fullName ?? '';

  const { data: farmersData, isLoading: farmersLoading } = useFarmers({
    page: 1,
    limit: 200,
    enabled: !!supervisorProfileId,
  });

  const { data: plotsData } = usePlots({
    page: 1,
    limit: 200,
    ...(supervisorProfileId ? { id_suppervisor: supervisorProfileId } : {}),
    enabled: !!supervisorProfileId,
  });

  const { data: priceBoardsData } = usePriceBoards({ page: 1, limit: 50, isActive: 'true' });
  const createMutation = useCreateContract();

  const farmers = farmersData?.data ?? [];
  const plots = plotsData?.data ?? [];
  const priceBoards = priceBoardsData?.data ?? [];

  const selectedFarmer = useMemo(
    () => farmers.find((f) => f.id === farmerId) ?? null,
    [farmers, farmerId],
  );

  const plotsForFarmer = useMemo(() => {
    if (!farmerId) return [];
    return plots.filter((p) => p.farmerId === farmerId);
  }, [plots, farmerId]);

  const selectedPlot = plotsForFarmer.find((p) => p.id === form.plotId) ?? null;

  useEffect(() => {
    if (!form.plotId || !farmerId) return;
    const stillOk = plotsForFarmer.some((p) => p.id === form.plotId);
    if (!stillOk) {
      setForm((prev) => ({ ...prev, plotId: '' }));
    }
  }, [farmerId, form.plotId, plotsForFarmer]);

  const draftVm = useMemo(
    () =>
      buildContractLegalViewModelFromDraft({
        me,
        supervisorProfileId,
        supervisorName,
        farmer: selectedFarmer,
        plot: selectedPlot,
        form: {
          cropType: form.cropType,
          quantityKg: form.quantityKg,
          pricePerKg: form.pricePerKg,
          grade: form.grade,
          signedAt: form.signedAt,
          harvestDue: form.harvestDue,
        },
      }),
    [me, supervisorProfileId, supervisorName, selectedFarmer, selectedPlot, form],
  );

  const partyA = PARTY_A_DOCUMENT_DEFAULTS;

  const validate = () => {
    if (!farmerId) return 'Chọn nông dân phụ trách';
    if (!form.plotId) return 'Chọn lô đất của nông dân';
    if (!form.cropType.trim()) return 'Nhập loại cây trồng';
    if (!form.quantityKg || Number(form.quantityKg) <= 0) return 'Sản lượng khoán phải lớn hơn 0';
    if (!form.pricePerKg || Number(form.pricePerKg) <= 0) return 'Giá sàn phải lớn hơn 0';
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    try {
      const created = await createMutation.mutateAsync(toPayload(form, farmerId));
      navigate(`/supervisor/contracts/${created.id}`, { replace: true });
    } catch {
      /* toast từ hook */
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read'));
      reader.readAsDataURL(file);
    });

  if (!supervisorProfileId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Không xác định được hồ sơ giám sát viên. Vui lòng đăng nhập lại.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4 pb-12 sm:p-6 sm:pb-16">
      <Breadcrumb
        items={[
          { label: 'Giám sát', href: '/supervisor' },
          { label: 'Hợp đồng', href: '/supervisor/contracts' },
          { label: 'Soạn hợp đồng' },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/supervisor/contracts" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Danh sách
            </Link>
          </Button>
          <h1 className="text-xl font-semibold sm:text-2xl">Soạn hợp đồng nháp</h1>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          In / PDF (xem trước)
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Chọn nông dân trong phạm vi phụ trách, lô đất lọc theo nông dân. Nội dung pháp lý cập nhật theo
        dữ liệu bạn nhập — sau khi lưu hệ thống gán số hợp đồng chính thức.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Đang soạn hợp đồng
              </p>
              <p className="text-sm text-foreground">Bản nháp mới chưa lưu lên hệ thống</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Grade: {form.grade}</span>
            <span className="h-1 w-1 rounded-full bg-primary/50" />
            <span>{form.cropType.trim() || 'Chưa chọn loại cây'}</span>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-300/40 bg-linear-to-r from-emerald-100/70 via-emerald-50 to-transparent p-3 dark:from-emerald-950/40 dark:via-emerald-950/20">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Trạng thái dữ liệu
              </p>
              <p className="text-sm text-foreground">
                {farmerId && form.plotId
                  ? 'Đủ dữ liệu cơ bản để lưu nháp'
                  : 'Cần chọn nông dân và lô đất'}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Chọn đầy đủ lô đất, sản lượng và giá để lưu nháp ngay.
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Building2 className="h-4 w-4" />
              </span>
              Bên A — Đơn vị liên kết (mẫu giấy)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-md border bg-linear-to-r from-primary/5 to-transparent p-3 text-sm sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground">Đơn vị liên kết</p>
                <p className="font-medium">{partyA.companyName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Đại diện pháp luật</p>
                <p className="text-sm">{partyA.legalRepresentative}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Định danh doanh nghiệp</p>
                <p className="text-sm">MST: {partyA.taxCode}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Địa bàn</p>
                <p className="text-sm">{partyA.bankPlace}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Tài khoản ngân hàng</p>
                <p className="text-sm">{partyA.bank}</p>
              </div>
              <div className="sm:col-span-2 border-t pt-2 text-[11px] italic text-muted-foreground">
                Dữ liệu Bên A đang dùng mock cố định để đồng bộ màn hình hợp đồng và bản in PDF.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <UserRound className="h-4 w-4" />
              </span>
              Bên B — Nông dân &amp; lô đất
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nông dân phụ trách</Label>
              <select
                value={farmerId}
                onChange={(e) => {
                  setFarmerId(e.target.value);
                  setForm((prev) => ({ ...prev, plotId: '' }));
                }}
                disabled={farmersLoading}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{farmersLoading ? 'Đang tải…' : 'Chọn nông dân'}</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fullName} — {f.phone}
                  </option>
                ))}
              </select>
            </div>

            {!farmerId ? (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Chọn nông dân để xem đầy đủ hồ sơ và danh sách lô.
              </p>
            ) : (
              <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Liên hệ
                  </p>
                  <p className="font-medium">{selectedFarmer?.fullName}</p>
                  <p className="text-xs text-muted-foreground">SĐT: {selectedFarmer?.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Định danh
                  </p>
                  <p className="text-xs">CCCD: {selectedFarmer?.cccd}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFarmer?.address || '—'}
                    {selectedFarmer?.province ? ` · ${selectedFarmer.province}` : ''}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5" />
                    Ngân hàng
                  </p>
                  <p className="text-xs">{selectedFarmer?.bankAccount || 'Chưa khai báo'}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Lô đất</Label>
              <select
                value={form.plotId}
                disabled={!farmerId}
                onChange={(e) => {
                  const plotId = e.target.value;
                  const plot = plotsForFarmer.find((item) => item.id === plotId);
                  setForm((prev) => ({
                    ...prev,
                    plotId,
                    cropType:
                      plot?.cropType === 'sau-rieng'
                        ? 'Sầu riêng'
                        : plot?.cropType === 'ca-phe'
                          ? 'Cà phê'
                          : prev.cropType,
                  }));
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              >
                <option value="">{farmerId ? 'Chọn lô' : 'Chọn nông dân trước'}</option>
                {plotsForFarmer.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.plotName} ({plot.lotCode})
                  </option>
                ))}
              </select>
              {farmerId && plotsForFarmer.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  Chưa có lô nào gắn nông dân này trong phạm vi phân công của bạn.
                </p>
              )}
              {selectedPlot && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                    <MapPin className="h-3.5 w-3.5" />
                    Mã lô: {selectedPlot.lotCode}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Wheat className="h-3.5 w-3.5" />
                    Diện tích: {selectedPlot.areaHa.toLocaleString('vi-VN')} ha
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Wheat className="h-4 w-4" />
            </span>
            Điều kiện khoán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bảng giá (tuỳ chọn)</Label>
            <select
              value={form.priceBoardId}
              onChange={(e) => setForm((prev) => ({ ...prev, priceBoardId: e.target.value }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Không gắn</option>
              {priceBoards.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.cropType} — Grade {pb.grade}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Loại cây trồng</Label>
              <Input
                value={form.cropType}
                onChange={(e) => setForm((prev) => ({ ...prev, cropType: e.target.value }))}
                placeholder="Cà phê / Sầu riêng"
              />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <select
                value={form.grade}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, grade: e.target.value as QualityGrade }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sản lượng khoán (kg)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.quantityKg}
                onChange={(e) => setForm((prev) => ({ ...prev, quantityKg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Giá sàn cố định (VNĐ/kg)</Label>
              <Input
                type="number"
                min={0.01}
                step="1"
                value={form.pricePerKg}
                onChange={(e) => setForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ngày ký</Label>
              <Input
                type="date"
                value={form.signedAt}
                onChange={(e) => setForm((prev) => ({ ...prev, signedAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc hợp đồng</Label>
              <Input
                type="date"
                value={form.harvestDue}
                onChange={(e) => setForm((prev) => ({ ...prev, harvestDue: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <ImageIcon className="h-4 w-4" />
            </span>
            Ảnh xác nhận (tuỳ chọn)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = await readFileAsDataUrl(file);
              setForm((prev) => ({ ...prev, signatureUrl: url }));
              e.target.value = '';
            }}
          />
          <Input
            value={form.signatureUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, signatureUrl: e.target.value }))}
            placeholder="Hoặc dán URL ảnh…"
          />
        </CardContent>
      </Card>

      <Card className="border-dashed border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Xem trước mẫu pháp lý</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[min(70vh,720px)] overflow-y-auto rounded-md border bg-white p-4 sm:p-6">
          <div id="contract-print-root">
            <ContractLegalTemplate vm={draftVm} />
          </div>
        </CardContent>
      </Card>

      {formError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to="/supervisor/contracts">Huỷ</Link>
        </Button>
        <Button onClick={() => void onSubmit()} disabled={createMutation.isPending}>
          <Save className="h-4 w-4" />
          {createMutation.isPending ? 'Đang lưu…' : 'Lưu nháp'}
        </Button>
      </div>
    </div>
  );
}

/** Cùng layout: `/supervisor/contracts/new` (không id) soạn mới; `/:id` chi tiết / sửa như cũ. */
export default function SupervisorContractWorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  if (id) {
    return <ContractDetailPage mode="supervisor" listBasePath="/supervisor/contracts" />;
  }
  return <SupervisorContractCreateWorkspace />;
}
