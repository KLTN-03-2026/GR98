import UsersManagementPage from "@/pages/admin/users";

export default function AdminFarmersPage() {
  return (
    <UsersManagementPage
      fixedRole="CLIENT"
      hideRoleSelector
      pageTitle="Nông dân"
    />
  );
}
