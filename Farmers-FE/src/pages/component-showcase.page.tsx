import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Trash2,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Eye,
  Search,
  Settings,
  Leaf,
  Activity,
  Package,
  Droplets,
  ChevronRight,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/custom/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

// ============================================================
// SECTION WRAPPER
// ============================================================
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-dashed border-border bg-card/50 p-6 space-y-4"
    >
      <div>
        <h2 className="text-lg font-bold text-foreground border-b border-dashed border-border/50 pb-2 mb-3">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

// ============================================================
// SECTION: BUTTONS
// ============================================================
function ButtonsSection() {
  return (
    <Section
      title="Nút Bấm — Button"
      description="Các variant và size của Button component. Dùng trong toàn bộ dự án."
    >
      {/* Solid Variants */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Solid Variants
        </Label>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* Outline + Color Variants */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Outline & Color Variants
        </Label>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">Outline</Button>
          <Button variant="outline-success">Outline Success</Button>
          <Button variant="outline-warning">Outline Warning</Button>
          <Button variant="outline-destructive">Outline Destructive</Button>
          <Button variant="purple">Purple</Button>
          <Button variant="pink">Pink</Button>
          <Button variant="orange">Orange</Button>
          <Button variant="emerald">Emerald</Button>
          <Button variant="cyan">Cyan</Button>
          <Button variant="indigo">Indigo</Button>
          <Button variant="slate">Slate</Button>
        </div>
      </div>

      {/* Dashed Variants */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Dashed Variants
        </Label>
        <div className="flex flex-wrap gap-3">
          <Button variant="dashed">Dashed</Button>
          <Button variant="dashed-success">Dashed Success</Button>
          <Button variant="dashed-warning">Dashed Warning</Button>
          <Button variant="dashed-destructive">Dashed Destructive</Button>
          <Button variant="dashed-purple">Dashed Purple</Button>
          <Button variant="dashed-pink">Dashed Pink</Button>
          <Button variant="dashed-emerald">Dashed Emerald</Button>
          <Button variant="dashed-cyan">Dashed Cyan</Button>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Sizes
        </Label>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">XL</Button>
          <Button size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* States */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          States
        </Label>
        <div className="flex flex-wrap gap-3">
          <Button disabled>Disabled</Button>
          <Button isLoading>Loading</Button>
        </div>
      </div>

      {/* With Icons */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          With Icons
        </Label>
        <div className="flex flex-wrap gap-3">
          <Button>
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="success">
            <CheckCircle2 className="h-4 w-4" />
            Confirm
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: BADGES & LABELS
// ============================================================
function BadgesSection() {
  return (
    <Section
      title="Badge & Nhãn"
      description="Badge dùng để hiển thị trạng thái, nhãn phân loại."
    >
      {/* Solid Badges */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Solid Badges
        </Label>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="purple">Purple</Badge>
          <Badge variant="pink">Pink</Badge>
          <Badge variant="orange">Orange</Badge>
          <Badge variant="emerald">Emerald</Badge>
          <Badge variant="cyan">Cyan</Badge>
          <Badge variant="indigo">Indigo</Badge>
          <Badge variant="rose">Rose</Badge>
          <Badge variant="teal">Teal</Badge>
          <Badge variant="lime">Lime</Badge>
          <Badge variant="yellow">Yellow</Badge>
        </div>
      </div>

      {/* Outline Badges */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Outline Badges
        </Label>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Outline</Badge>
          <Badge variant="outline-success">Outline Success</Badge>
          <Badge variant="outline-warning">Outline Warning</Badge>
          <Badge variant="outline-destructive">Outline Destructive</Badge>
          <Badge variant="outline">Outline Purple</Badge>
        </div>
      </div>

      {/* Soft Badges */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Soft Badges
        </Label>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft-success">Soft Success</Badge>
          <Badge variant="soft-warning">Soft Warning</Badge>
          <Badge variant="soft-info">Soft Info</Badge>
          <Badge variant="soft-destructive">Soft Destructive</Badge>
          <Badge variant="soft-purple">Soft Purple</Badge>
          <Badge variant="soft-pink">Soft Pink</Badge>
        </div>
      </div>

      {/* Dashed Badges */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Dashed Badges
        </Label>
        <div className="flex flex-wrap gap-2">
          <Badge variant="dashed">Dashed</Badge>
          <Badge variant="dashed-success">Dashed Success</Badge>
          <Badge variant="dashed-warning">Dashed Warning</Badge>
          <Badge variant="dashed-destructive">Dashed Destructive</Badge>
          <Badge variant="dashed-purple">Dashed Purple</Badge>
          <Badge variant="dashed-emerald">Dashed Emerald</Badge>
          <Badge variant="dashed-pink">Dashed Pink</Badge>
          <Badge variant="dashed-cyan">Dashed Cyan</Badge>
        </div>
      </div>

      {/* Badge Sizes */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Badge kết hợp với Badge count
        </Label>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3" />
            Pending
          </Badge>
          <Badge variant="destructive">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
          <Badge variant="soft-info">
            <Info className="h-3 w-3" />
            Info
          </Badge>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: TOASTS
// ============================================================
function ToastsSection() {
  const triggerToast = (type: string, message: string) => {
    const icons = {
      success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
      warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      info: <Info className="h-5 w-5 text-blue-500" />,
    };

    toast.custom((t) => (
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg flex items-center gap-3 w-full max-w-sm">
        {icons[type as keyof typeof icons]}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground capitalize">
            {type}
          </p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t)}
          className="text-muted-foreground hover:text-foreground"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    ));
  };

  return (
    <Section
      title="Thông Báo — Toast"
      description="Các loại toast notification. Click để trigger."
    >
      <div className="flex flex-wrap gap-3">
        <Button
          variant="success"
          onClick={() =>
            triggerToast("success", "Thao tác thành công! Dữ liệu đã được lưu.")
          }
        >
          <CheckCircle2 className="h-4 w-4" />
          Success Toast
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            triggerToast("error", "Đã xảy ra lỗi. Vui lòng thử lại sau.")
          }
        >
          <XCircle className="h-4 w-4" />
          Error Toast
        </Button>
        <Button
          variant="warning"
          onClick={() =>
            triggerToast("warning", "Cảnh báo: Dữ liệu sắp hết hạn lưu trữ.")
          }
        >
          <AlertTriangle className="h-4 w-4" />
          Warning Toast
        </Button>
        <Button
          variant="info"
          onClick={() =>
            triggerToast("info", "Thông tin: Hệ thống sẽ bảo trì vào 02:00 AM.")
          }
        >
          <Info className="h-4 w-4" />
          Info Toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast("Thông báo mặc định — không có icon tùy chỉnh")}
        >
          <Bell className="h-4 w-4" />
          Default Toast
        </Button>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: DIALOG
// ============================================================
function DialogsSection() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Section
      title="Hộp Thoại — Dialog"
      description="Dialog dùng cho xác nhận hành động quan trọng, form nhập liệu."
    >
      <div className="flex flex-wrap gap-3">
        {/* Basic Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Basic Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận hành động</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn thực hiện hành động này? Hành động này
                không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="dialog-name">Tên</Label>
                <Input id="dialog-name" placeholder="Nhập tên của bạn" />
              </div>
              <div>
                <Label htmlFor="dialog-note">Ghi chú</Label>
                <Textarea id="dialog-note" placeholder="Nhập ghi chú..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Confirm Delete</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xóa mục này?</DialogTitle>
              <DialogDescription>
                Hành động này sẽ xóa vĩnh viễn dữ liệu. Bạn có chắc chắn muốn
                tiếp tục?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(false)}
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="success">Success Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <DialogTitle className="text-center">Thành công!</DialogTitle>
              <DialogDescription className="text-center mt-2">
                Dữ liệu của bạn đã được lưu thành công.
              </DialogDescription>
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={() => {}}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: SHEET (SLIDE-OVER PANEL)
// ============================================================
function SheetsSection() {
  return (
    <Section
      title="Sheet Panel"
      description="Sheet (slide-over) dùng cho danh sách lọc, quick actions, form phụ."
    >
      <div className="flex flex-wrap gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Sheet Right</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Bảng Điều Khiển</SheetTitle>
              <SheetDescription>Tùy chỉnh hiển thị và bộ lọc</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Tìm kiếm</Label>
                <Input placeholder="Nhập từ khóa..." />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Combobox
                  label="Trạng thái"
                  dataArr={[
                    { value: "active", label: "Hoạt động" },
                    { value: "inactive", label: "Không hoạt động" },
                    { value: "pending", label: "Đang chờ" },
                  ]}
                  onChange={(v) => console.log("selected", v)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Quick Filters
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="soft-success">Đắk Lắk</Badge>
                  <Badge variant="soft-info">2024</Badge>
                  <Badge variant="soft-warning">100kg</Badge>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          S
          <SheetTrigger asChild>
            <Button variant="outline">Sheet Bottom</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Chi Tiết Sản Phẩm</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Tên sản phẩm
                  </Label>
                  <p className="font-medium">Sầu Riêng Ri 6 A</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Giá</Label>
                  <p className="font-medium">89,000đ/kg</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: INPUTS
// ============================================================
function InputsSection() {
  return (
    <Section title=" Ô Input" description="Các loại input field.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="input-text">Text Input</Label>
          <Input id="input-text" placeholder="Nhập văn bản..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="input-email">Email Input</Label>
          <Input
            id="input-email"
            type="email"
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="input-password">Password Input</Label>
          <Input id="input-password" type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="input-number">Number Input</Label>
          <Input id="input-number" type="number" placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="input-search">Search Input</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="input-search"
              placeholder="Tìm kiếm..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="input-disabled">Disabled Input</Label>
          <Input id="input-disabled" placeholder="Disabled" disabled />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="input-error">Input với Error</Label>
          <Input
            id="input-error"
            placeholder="Invalid input"
            className="border-red-500 focus:border-red-500"
          />
          <p className="text-xs text-red-500">
            Trường này không hợp lệ. Vui lòng kiểm tra lại.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: COMBOBOX
// ============================================================
function ComboboxSection() {
  const [selectedValue, setSelectedValue] = useState<string>("");

  return (
    <Section
      title="Combobox"
      description="Dropdown có search, dùng cho select với danh sách dài."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Chọn Tỉnh / Thành</Label>
          <Combobox
            label="Tỉnh / Thành"
            dataArr={[
              { value: "hcm", label: "TP. Hồ Chí Minh" },
              { value: "hn", label: "TP. Hà Nội" },
              { value: "daklak", label: "Đắk Lắk" },
              { value: "lamdong", label: "Lâm Đồng" },
              { value: "daknong", label: "Đắk Nông" },
              { value: "gialai", label: "Gia Lai" },
              { value: "kontum", label: "Kon Tum" },
              { value: "phuyen", label: "Phú Yên" },
              { value: "khanhhoa", label: "Khánh Hòa" },
              { value: "binhthuan", label: "Bình Thuận" },
            ]}
            value={selectedValue}
            onChange={(v) => setSelectedValue(v as string)}
          />
          {selectedValue && (
            <p className="text-xs text-muted-foreground">
              Đã chọn:{" "}
              <span className="font-medium text-foreground">
                {selectedValue}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Chọn Nhiều (Multi-select)</Label>
          <Combobox
            label="Loại sản phẩm"
            dataArr={[
              { value: "saurieng", label: "Sầu Riêng" },
              { value: "caphe", label: "Cà Phê" },
              { value: "ca", label: "Cá" },
              { value: "tom", label: "Tôm" },
            ]}
            isMultiSelect
          />
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: CARDS
// ============================================================
function CardsSection() {
  return (
    <Section
      title="Card"
      description="Card dùng để hiển thị nội dung trong một khối có border."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>
              Card description — mô tả ngắn về nội dung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nội dung chính của card. Có thể chứa text, hình ảnh, hoặc bất kỳ
              component nào.
            </p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline">
                Hủy
              </Button>
              <Button size="sm">Xác nhận</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="dashed-success">New</Badge>
              Card Dashed
            </CardTitle>
            <CardDescription>Card với border dashed.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dùng border-dashed cho trạng thái pending, placeholder.
            </p>
            <Badge variant="soft-info" className="mt-3">
              Draft
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Success Card
            </CardTitle>
            <CardDescription>Card với background gradient.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Thành công! Mọi thứ đã hoàn tất.
            </p>
            <Button variant="success" size="sm" className="mt-3">
              <CheckCircle2 className="h-4 w-4" />
              Hoàn Thành
            </Button>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

// ============================================================
// SECTION: DESIGN-SKILL PREVIEW (BASE PALETTE)
// ============================================================
function DesignSkillSection() {
  const metrics = [
    {
      title: "Nong do am",
      value: 72,
      unit: "%",
      subtitle: "Dat giu am on dinh",
      icon: Droplets,
      iconColor: "#3B82F6",
      gradient: "from-[#E8F2FF] via-[#F4F8FF] to-[#FCFDFF]",
      border: "border-[#3B82F6]/[0.18]",
      shadow:
        "shadow-[0_8px_24px_-3px_rgba(59,130,246,0.14),0_2px_6px_0_rgba(59,130,246,0.06)]",
    },
    {
      title: "Nang suat",
      value: 24,
      unit: "tan",
      subtitle: "Tang 8% so voi tuan truoc",
      icon: Leaf,
      iconColor: "#7BAE3C",
      gradient: "from-[#E8F3DA] via-[#F2F7EB] to-[#FBFDF8]",
      border: "border-[#7BAE3C]/[0.18]",
      shadow:
        "shadow-[0_8px_24px_-3px_rgba(123,174,60,0.14),0_2px_6px_0_rgba(123,174,60,0.06)]",
    },
    {
      title: "Don dang xu ly",
      value: 18,
      unit: "don",
      subtitle: "4 don can uu tien",
      icon: Package,
      iconColor: "#F59E0B",
      gradient: "from-[#FFF3DB] via-[#FFF8EA] to-[#FFFCF5]",
      border: "border-[#F59E0B]/[0.18]",
      shadow:
        "shadow-[0_8px_24px_-3px_rgba(245,158,11,0.14),0_2px_6px_0_rgba(245,158,11,0.06)]",
    },
    {
      title: "Canh bao",
      value: 3,
      unit: "muc",
      subtitle: "Can kiem tra he thong tuoi",
      icon: AlertTriangle,
      iconColor: "#EF4444",
      gradient: "from-[#FFE6E6] via-[#FFF1F3] to-[#FFF8FA]",
      border: "border-[#EF4444]/[0.18]",
      shadow:
        "shadow-[0_8px_24px_-3px_rgba(239,68,68,0.14),0_2px_6px_0_rgba(239,68,68,0.06)]",
    },
  ];

  return (
    <Section
      title="Design Skill + Base Mau"
      description="Preview card style theo design.md voi base palette hien tai (#7BAE3C, #2F5D50, #3B82F6, #1F2937)."
    >
      <div className="rounded-[28px] border border-[#CFE3B8] bg-linear-to-br from-[#E8F3DA] via-[#F2F7EB] to-[#FBFDF8] p-4 md:p-[18px] shadow-[0_18px_28px_-6px_rgba(47,93,80,0.08)] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-[42px] w-[42px] rounded-[14px] bg-linear-to-br from-[#DCEADF] to-[#ECF4EE] shadow-[0_3px_8px_-2px_rgba(47,93,80,0.15)] flex items-center justify-center">
              <Activity
                className="h-[22px] w-[22px]"
                style={{ color: "#2F5D50" }}
              />
            </div>
            <div>
              <p
                className="text-[13px] font-bold uppercase tracking-wide"
                style={{ color: "#2F5D50" }}
              >
                He thong nong trai
              </p>
              <h3 className="text-[18px] font-bold text-slate-900">
                Tong quan van hanh hom nay
              </h3>
            </div>
          </div>

          <Button
            variant="ghost"
            className="rounded-xl border border-[#2F5D50]/22 bg-white/78 px-[11px] py-[7px] text-[12px] font-semibold text-[#2F5D50] shadow-none"
          >
            Xem them
            <ChevronRight className="h-[15px] w-[15px]" />
          </Button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-[14px] border border-white/95 bg-white/72 px-3 py-[9px] shadow-[0_3px_10px_0_rgba(47,93,80,0.07)]">
          <Circle
            className="h-2 w-2 fill-current"
            style={{
              color: "#2F5D50",
              filter: "drop-shadow(0 0 5px rgba(47,93,80,0.55))",
            }}
          />
          <span className="text-xs font-bold" style={{ color: "#2F5D50" }}>
            Active
          </span>
          <div className="h-[13px] w-px bg-[#C8D8CF]" />
          <span className="text-xs font-bold" style={{ color: "#2F5D50" }}>
            85% hieu suat
          </span>
        </div>

        <div className="rounded-[22px] border border-[#E1ECD2] bg-linear-to-br from-[#F6FAF1] via-[#FCFDFB] to-white p-[14px_14px_16px] shadow-[0_4px_14px_-2px_rgba(47,93,80,0.05)]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.title}
                  className={`h-[132px] rounded-[20px] border p-[14px_14px_12px] ${metric.gradient} ${metric.border} ${metric.shadow}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="h-[34px] w-[34px] rounded-[11px] flex items-center justify-center"
                      style={{ backgroundColor: metric.iconColor }}
                    >
                      <Icon className="h-[18px] w-[18px] text-white" />
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{ color: metric.iconColor }}
                    >
                      {metric.title}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end gap-1.5">
                    <span
                      className="text-2xl font-extrabold leading-[1.05]"
                      style={{ color: metric.iconColor }}
                    >
                      {metric.value}
                    </span>
                    <span
                      className="pb-[3px] text-[11px] font-bold"
                      style={{ color: metric.iconColor, opacity: 0.72 }}
                    >
                      {metric.unit}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: metric.iconColor,
                        opacity: 0.45,
                      }}
                    />
                    <span className="text-[11px] leading-[1.35] text-slate-500">
                      {metric.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="rounded-full bg-[#7BAE3C] px-3.5 py-2.5 text-[13px] font-bold text-white shadow-[0_5px_12px_rgba(47,93,80,0.18)]">
            <CheckCircle2 className="h-4 w-4" />
            Duyet ngay
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ============================================================
// PAGE: COMPONENT SHOWCASE
// ============================================================
export default function ComponentShowcasePage() {
  return (
    <div className="h-full overflow-y-auto pr-1 pb-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Component Showcase
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Toàn bộ UI components dùng trong dự án Farmers
          </p>
        </div>
        <Badge variant="dashed" className="text-sm py-1.5 px-3">
          {new Date().toLocaleDateString("vi-VN")}
        </Badge>
      </motion.div>

      {/* Components */}
      <ButtonsSection />
      <BadgesSection />
      <ToastsSection />
      <DialogsSection />
      <SheetsSection />
      <InputsSection />
      <ComboboxSection />
      <CardsSection />
      <DesignSkillSection />

      {/* Footer note */}
      <div className="text-center py-4">
        <Badge variant="outline" className="text-xs">
          Vietnam Farmer UI Component Showcase
        </Badge>
      </div>
    </div>
  );
}
