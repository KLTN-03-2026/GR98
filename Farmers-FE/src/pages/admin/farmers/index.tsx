import UsersManagementPage from "@/pages/admin/users";

export default function AdminFarmersPage() {
  return (
    <UsersManagementPage
      fixedRole="CLIENT"
      hideRoleSelector
      readOnlyList
      pageTitle="Nông dân"
    />
  );
}
