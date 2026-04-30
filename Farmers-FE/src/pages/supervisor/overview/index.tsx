import { LayoutDashboard } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8">
          <LayoutDashboard className="size-4 text-primary" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Tổng quan
        </h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Trang đang được phát triển. Đây là bản mock hiển thị chữ.
      </p>
    </div>
  );
}