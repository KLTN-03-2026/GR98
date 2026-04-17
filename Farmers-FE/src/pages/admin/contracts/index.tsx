import ContractsManagementView from '@/pages/contracts/components/contracts-management-view';

export default function AdminContractsPage() {
  return <ContractsManagementView mode="admin" listBasePath="/dashboard/contracts" />;
}
