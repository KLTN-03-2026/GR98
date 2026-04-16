import ContractsManagementView from '@/pages/contracts/components/contracts-management-view';

export default function SupervisorContractsPage() {
  return <ContractsManagementView mode="supervisor" listBasePath="/supervisor/contracts" />;
}
