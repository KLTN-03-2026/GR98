import type { ContractStatus, QualityGrade } from '@/pages/admin/contracts/api';

export function getContractStatusLabel(status: ContractStatus) {
  const map: Record<ContractStatus, string> = {
    DRAFT: 'Bản nháp',
    SIGNED: 'Chờ phê duyệt',
    ACTIVE: 'Đang hiệu lực',
    SETTLED: 'Đã tất toán',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn thành',
    TERMINATED: 'Chấm dứt',
  };
  return map[status] ?? status;
}

export function getContractStatusBadgeVariant(status: ContractStatus) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'SIGNED') return 'warning' as const;
  if (status === 'CANCELLED' || status === 'TERMINATED') return 'destructive' as const;
  if (status === 'SETTLED' || status === 'COMPLETED') return 'secondary' as const;
  return 'outline' as const;
}

export function getGradeBadgeVariant(grade: QualityGrade) {
  if (grade === 'A') return 'soft-success' as const;
  if (grade === 'B') return 'soft-warning' as const;
  if (grade === 'REJECT') return 'soft-destructive' as const;
  return 'soft-info' as const;
}

export function getCropBadgeVariant(cropType?: string | null) {
  const key = (cropType || '').toLowerCase();
  if (key.includes('cà phê') || key.includes('ca-phe') || key.includes('ca phe')) {
    return 'dashed-success' as const;
  }
  if (key.includes('sầu') || key.includes('sau-rieng') || key.includes('durian')) {
    return 'dashed-warning' as const;
  }
  return 'dashed' as const;
}

