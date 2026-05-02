import { useSearchParams } from "react-router-dom";
import UsersManagementPage from "@/pages/admin/users";
import AdminSupervisorsPage from "@/pages/admin/supervisors";
import AdminInventoryStaffPage from "@/pages/admin/inventory-staff";
import AdminFarmersPage from "@/pages/admin/farmers";

type PeopleTab = "users" | "supervisors" | "inventory-staff" | "farmers";

function normalizeTab(raw: string | null): PeopleTab {
  if (raw === "supervisors") return "supervisors";
  if (raw === "inventory-staff") return "inventory-staff";
  if (raw === "farmers") return "farmers";
  return "users";
}

export default function AdminAccountManagementPage() {
  const [searchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get("tab"));
  const isCompactPaddingTab = activeTab === "users" || activeTab === "farmers";

  return (
    <div
      className={`h-full min-h-0 flex flex-col ${isCompactPaddingTab ? "p-0" : "p-4 sm:p-6"}`}
    >
      <div className="min-h-0 flex-1">
        {activeTab === "users" && <UsersManagementPage excludeClientByDefault />}
        {activeTab === "supervisors" && <AdminSupervisorsPage />}
        {activeTab === "inventory-staff" && <AdminInventoryStaffPage />}
        {activeTab === "farmers" && <AdminFarmersPage />}
      </div>
    </div>
  );
}
