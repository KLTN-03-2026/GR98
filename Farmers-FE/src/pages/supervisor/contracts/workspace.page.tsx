import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Landmark,
  Phone,
  PlusCircle,
  Printer,
  Save,
  UserRound,
  Wheat,
  X,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/custom/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe } from '@/client/api/auth/use-me';
import { useFarmers } from '@/pages/admin/farmers/api';
import {
  useCreateContract,
  type CreateContractPayload,
  type QualityGrade,
} from '@/pages/admin/contracts/api';
import { useVietnamAdministrative } from '@/lib/vn-administrative';
import ContractDetailPage from '@/pages/contracts/contract-detail.page';
import { ContractLegalTemplate } from '@/pages/contracts/components/contract-legal-template';
import {
  PARTY_A_DOCUMENT_DEFAULTS,
  buildContractLegalViewModelFromDraft,
} from '@/pages/contracts/contract-legal-view-model';
import '@/pages/contracts/contract-print.css';

type CoordinatePair = [string, string]; // [lat, lng]

type FormState = {
  plotDraftProvince: string;
  plotDraftDistrict: string;
  plotDraftAreaHa: string;
  plotDraftCoordinates: CoordinatePair[];
  cropType: string;
  grade: QualityGrade;
  signedAt: string;
  harvestDue: string;
};

const defaultForm: FormState = {
  plotDraftProvince: '',
  plotDraftDistrict: '',
  plotDraftAreaHa: '',
  plotDraftCoordinates: [['', '']],
  cropType: '',
  grade: 'A',
  signedAt: '',
  harvestDue: '',
};

const CROP_OPTIONS = [
  { value: 'ca-phe', label: 'Cà phê' },
  { value: 'sau-rieng', label: 'Sầu riêng' },
] as const;

function getCropLabel(value: string) {
  return CROP_OPTIONS.find((item) => item.value === value)?.label ?? 'Chưa chọn loại cây';
}

function toPayload(form: FormState, farmerId: string | undefined): CreateContractPayload {
  const coordinateLines = form.plotDraftCoordinates
    .map(([lat, lng]) => {
      const trimmedLat = lat.trim();
      const trimmedLng = lng.trim();
      if (!trimmedLat || !trimmedLng) return '';
      return `${trimmedLat},${trimmedLng}`;
    })
    .filter(Boolean);
  return {
    farmerId: farmerId || undefined,
    plotDraftProvince: form.plotDraftProvince.trim() || undefined,
    plotDraftDistrict: form.plotDraftDistrict.trim() || undefined,
    plotDraftAreaHa: form.plotDraftAreaHa ? Number(form.plotDraftAreaHa) : undefined,
    plotDraftCoordinatesText: coordinateLines.length ? coordinateLines.join('\n') : undefined,
    cropType: form.cropType.trim(),
    grade: form.grade,
    signedAt: form.signedAt || undefined,
    harvestDue: form.harvestDue || undefined,
  };
}

function SupervisorContractCreateWorkspace() {
  const navigate = useNavigate();
  const [farmerId, setFarmerId] = useState('');
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingCoordinateRow, setPendingCoordinateRow] = useState<number | null>(null);
  const coordinateInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const { data: me } = useMe();
  const supervisorProfileId = me?.supervisorProfile?.id ?? '';
  const supervisorName = me?.fullName ?? '';
  const { data: provinceOptions = [] } = useVietnamAdministrative();

  const { data: farmersData, isLoading: farmersLoading } = useFarmers({
    page: 1,
    limit: 200,
    enabled: !!supervisorProfileId,
  });
  const createMutation = useCreateContract();

  const farmers = farmersData?.data ?? [];
  const selectedFarmer = useMemo(
    () => farmers.find((f) => f.id === farmerId) ?? null,
    [farmers, farmerId],
  );
  const plotDistrictOptions = useMemo(
    () =>
      provinceOptions.find((item) => item.value === form.plotDraftProvince)
        ?.districts ?? [],
    [provinceOptions, form.plotDraftProvince],
  );

  const draftVm = useMemo(
    () =>
      buildContractLegalViewModelFromDraft({
        me,
        supervisorProfileId,
        supervisorName,
        farmer: selectedFarmer,
        form: {
          plotDraftProvince: form.plotDraftProvince,
          plotDraftDistrict: form.plotDraftDistrict,
          plotDraftAreaHa: form.plotDraftAreaHa,
          plotDraftCoordinates: form.plotDraftCoordinates,
          cropType: form.cropType,
          grade: form.grade,
          signedAt: form.signedAt,
          harvestDue: form.harvestDue,
        },
      }),
    [me, supervisorProfileId, supervisorName, selectedFarmer, form],
  );

  const partyA = PARTY_A_DOCUMENT_DEFAULTS;

  useEffect(() => {
    if (pendingCoordinateRow === null) return;
    const target = coordinateInputRefs.current.get(`coord-${pendingCoordinateRow}-lat`);
    if (target) {
      target.focus();
    }
    setPendingCoordinateRow(null);
  }, [form.plotDraftCoordinates.length, pendingCoordinateRow]);

  const validate = () => {
    if (!farmerId) return 'Chọn nông dân phụ trách';
    if (!form.plotDraftProvince.trim()) return 'Chọn Tỉnh/Thành của lô đất';
    if (!form.plotDraftDistrict.trim()) return 'Chọn Quận/Huyện của lô đất';
    if (!form.plotDraftAreaHa || Number(form.plotDraftAreaHa) <= 0) {
      return 'Diện tích chuẩn lô đất phải lớn hơn 0';
    }
    const hasInvalidCoordinate = form.plotDraftCoordinates.some(([lat, lng]) => {
      const trimmedLat = lat.trim();
      const trimmedLng = lng.trim();
      if (!trimmedLat && !trimmedLng) return false;
      return Number.isNaN(Number(trimmedLat)) || Number.isNaN(Number(trimmedLng));
    });
    if (hasInvalidCoordinate) return 'Danh sách tọa độ phải là các số hợp lệ';
    const validCoordinates = form.plotDraftCoordinates.filter(([lat, lng]) => {
      return lat.trim() && lng.trim();
    });
    if (validCoordinates.length === 0) {
      return 'Phải nhập ít nhất một cặp tọa độ (vĩ độ và kinh độ)';
    }
    if (validCoordinates.length < 3) {
      return 'Phải nhập tối thiểu 3 điểm tọa độ để tạo lô đất';
    }
    if (
      form.signedAt &&
      form.harvestDue &&
      new Date(form.signedAt).getTime() > new Date(form.harvestDue).getTime()
    ) {
      return 'Ngày ký không được lớn hơn ngày kết thúc hợp đồng';
    }
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
        Chọn nông dân có sẵn rồi điền thông tin lô đất. Hợp đồng có thể gửi admin duyệt mà không cần ảnh ký.
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
            <span>{getCropLabel(form.cropType)}</span>
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
                {farmerId && form.plotDraftAreaHa
                  ? 'Đủ dữ liệu cơ bản để lưu nháp'
                  : 'Cần chọn đối tác và điền thông tin lô đất'}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Điền thông tin lô đất và loại cây để lưu nháp ngay.
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
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <UserRound className="h-4 w-4" />
              </span>
              Bên B — Đối tác
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nông dân phụ trách</Label>
              <select
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
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

            {selectedFarmer && (
              <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Liên hệ
                  </p>
                  <p className="font-medium">{selectedFarmer.fullName}</p>
                  <p className="text-xs text-muted-foreground">SĐT: {selectedFarmer.phone}</p>
                  <p className="text-xs text-muted-foreground">CCCD: {selectedFarmer.cccd}</p>
                </div>
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5" />
                    Ngân hàng
                  </p>
                  <p className="text-xs">
                    {selectedFarmer.bankName || 'Chưa khai báo'} - {selectedFarmer.bankBranch || '---'} -{' '}
                    {selectedFarmer.bankAccount || 'Chưa có số tài khoản'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFarmer.address || '—'}
                    {selectedFarmer.province ? ` · ${selectedFarmer.province}` : ''}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">Thông tin lô đất</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tỉnh / thành</Label>
                  <Combobox
                    dataArr={provinceOptions}
                    value={form.plotDraftProvince}
                    onChange={(value) => {
                      const nextProvince = typeof value === 'string' ? value : '';
                      setForm((prev) => ({
                        ...prev,
                        plotDraftProvince: nextProvince,
                        plotDraftDistrict:
                          nextProvince === prev.plotDraftProvince ? prev.plotDraftDistrict : '',
                      }));
                    }}
                    label="tỉnh/thành"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quận / huyện</Label>
                  <Combobox
                    dataArr={plotDistrictOptions}
                    value={form.plotDraftDistrict}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        plotDraftDistrict: typeof value === 'string' ? value : '',
                      }))
                    }
                    label="quận/huyện"
                    disabled={!form.plotDraftProvince}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={form.plotDraftAreaHa}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, plotDraftAreaHa: e.target.value }))
                    }
                    placeholder="Diện tích chuẩn (ha)"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Tọa độ</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
                      <span>Vĩ độ (lat)</span>
                      <span>Kinh độ (lng)</span>
                      <span></span>
                    </div>
                    {form.plotDraftCoordinates.map(([lat, lng], index) => (
                      <div key={`coord-row-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                        <Input
                          ref={(node) => {
                            coordinateInputRefs.current.set(`coord-${index}-lat`, node);
                          }}
                          value={lat}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              plotDraftCoordinates: prev.plotDraftCoordinates.map((pair, i) =>
                                i === index ? [e.target.value, pair[1]] : pair,
                              ),
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            const nextIndex = form.plotDraftCoordinates.length;
                            setForm((prev) => ({
                              ...prev,
                              plotDraftCoordinates: [...prev.plotDraftCoordinates, ['', '']],
                            }));
                            setPendingCoordinateRow(nextIndex);
                          }}
                          placeholder={`15.94xxxx`}
                        />
                        <Input
                          ref={(node) => {
                            coordinateInputRefs.current.set(`coord-${index}-lng`, node);
                          }}
                          value={lng}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              plotDraftCoordinates: prev.plotDraftCoordinates.map((pair, i) =>
                                i === index ? [pair[0], e.target.value] : pair,
                              ),
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            const nextIndex = form.plotDraftCoordinates.length;
                            setForm((prev) => ({
                              ...prev,
                              plotDraftCoordinates: [...prev.plotDraftCoordinates, ['', '']],
                            }));
                            setPendingCoordinateRow(nextIndex);
                          }}
                          placeholder={`108.28xxxx`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              plotDraftCoordinates: prev.plotDraftCoordinates.filter((_, i) => i !== index),
                            }))
                          }
                          disabled={form.plotDraftCoordinates.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextIndex = form.plotDraftCoordinates.length;
                        setForm((prev) => ({
                          ...prev,
                          plotDraftCoordinates: [...prev.plotDraftCoordinates, ['', '']],
                        }));
                        setPendingCoordinateRow(nextIndex);
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Thêm điểm
                    </Button>
                  </div>
                </div>
              </div>
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
            Thông tin hợp đồng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Loại cây trồng</Label>
              <select
                value={form.cropType}
                onChange={(e) => setForm((prev) => ({ ...prev, cropType: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Chọn loại cây trồng</option>
                {CROP_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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

export default function SupervisorContractWorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  if (id) {
    return <ContractDetailPage mode="supervisor" listBasePath="/supervisor/contracts" />;
  }
  return <SupervisorContractCreateWorkspace />;
}
