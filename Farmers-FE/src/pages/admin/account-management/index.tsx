import { useSearchParams } from "react-router-dom";
import UsersManagementPage from "@/pages/admin/users";
import AdminSupervisorsPage from "@/pages/admin/supervisors";
import AdminInventoryStaffPage from "@/pages/admin/inventory-staff";
import AdminFarmersPage from "@/pages/admin/farmers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PeopleTab = "users" | "supervisors" | "inventory-staff" | "farmers";

const PEOPLE_TABS: Array<{ value: PeopleTab; label: string }> = [
  { value: "users", label: "Tài khoản" },
  { value: "supervisors", label: "Giám sát viên" },
  { value: "inventory-staff", label: "Nhân viên kho" },
  { value: "farmers", label: "Quản lý Nông dân" },
];

function normalizeTab(raw: string | null): PeopleTab {
  if (raw === "supervisors") return "supervisors";
  if (raw === "inventory-staff") return "inventory-staff";
  if (raw === "farmers") return "farmers";
  return "users";
}

export default function AdminAccountManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get("tab"));

  const handleTabChange = (nextTab: PeopleTab) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === "users") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-primary/40 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">Quản lý Tài khoản</p>

        <Select value={activeTab} onValueChange={(value) => handleTabChange(value as PeopleTab)}>
          <SelectTrigger className="h-9 w-full sm:w-[220px]">
            <SelectValue placeholder="Chọn nhóm nhân sự" />
          </SelectTrigger>
          <SelectContent>
            {PEOPLE_TABS.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === "users" && <UsersManagementPage />}
        {activeTab === "supervisors" && <AdminSupervisorsPage />}
        {activeTab === "inventory-staff" && <AdminInventoryStaffPage />}
        {activeTab === "farmers" && <AdminFarmersPage />}
      </div>
    </div>
  );
}
