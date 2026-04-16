import ContractDetailPage from '@/pages/contracts/contract-detail.page';

export default function AdminContractDetailRoute() {
  return <ContractDetailPage mode="admin" listBasePath="/dashboard/contracts" />;
}
