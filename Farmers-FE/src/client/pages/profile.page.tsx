import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Bell,
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  Edit,
  Phone,
  Mail,
  Calendar,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useCreateShippingAddress,
  useDeleteShippingAddress,
  useMe,
  useSetDefaultShippingAddress,
  useChangePassword,
  useUpdateMe,
  useDeleteAccount,
} from '@/client/api';
import { useAuthStore } from '@/client/store';

type TabKey = 'profile' | 'address' | 'notifications' | 'security';

const TABS = [
  { key: 'profile' as const, label: 'Hồ sơ', icon: User },
  { key: 'address' as const, label: 'Địa chỉ', icon: MapPin },
  { key: 'notifications' as const, label: 'Thông báo', icon: Bell },
  { key: 'security' as const, label: 'Bảo mật', icon: CreditCard },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const { data: me, isLoading, isError, error, refetch } = useMe();
  const updateMe = useUpdateMe();
  const setUser = useAuthStore((s) => s.setUser);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    district: '',
    province: '',
    isDefault: false,
  });

  const createAddress = useCreateShippingAddress();
  const deleteAddress = useDeleteShippingAddress();
  const setDefaultAddress = useSetDefaultShippingAddress();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) {
      toast.error('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (pwdForm.next.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    changePassword.mutate(
      { currentPassword: pwdForm.current, newPassword: pwdForm.next },
      {
        onSuccess: () => {
          setPwdForm({ current: '', next: '', confirm: '' });
        },
      },
    );
  };

  useEffect(() => {
    if (!me) return;
    setUser({
      fullName: me.fullName,
      email: me.email,
      phone: me.phone ?? undefined,
      avatarUrl: me.avatar ?? undefined,
    });
  }, [me, setUser]);

  useEffect(() => {
    if (me) {
      setFormData({
        fullName: me.fullName,
        email: me.email,
        phone: me.phone ?? '',
      });
    }
  }, [me]);

  const handleSaveProfile = () => {
    updateMe.mutate(
      { fullName: formData.fullName, phone: formData.phone },
      {
        onSuccess: () => {
          setIsEditing(false);
          useAuthStore.getState().setUser({ fullName: formData.fullName, phone: formData.phone });
        },
      },
    );
  };

  const addresses = me?.clientProfile?.shippingAddresses ?? [];
  const canManageAddresses =
    me != null && me.role === 'CLIENT' && me.clientProfile != null;

  const openAddAddressDialog = () => {
    if (!me || me.role !== 'CLIENT' || !me.clientProfile) return;
    const { clientProfile } = me;
    setNewAddress({
      fullName: me.fullName,
      phone: me.phone ?? '',
      addressLine: '',
      district: '',
      province: clientProfile.province ?? '',
      isDefault: addresses.length === 0,
    });
    setAddressDialogOpen(true);
  };

  const handleSubmitNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !canManageAddresses) return;
    const { fullName, phone, addressLine, province } = newAddress;
    if (!fullName.trim() || !phone.trim() || !addressLine.trim() || !province.trim()) {
      toast.error('Vui lòng điền đầy đủ họ tên, SĐT, địa chỉ và tỉnh/thành.');
      return;
    }
    createAddress.mutate(
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine: addressLine.trim(),
        district: newAddress.district.trim() || undefined,
        province: province.trim(),
        isDefault: newAddress.isDefault,
      },
      { onSuccess: () => setAddressDialogOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !me) {
    return (
      <div className="bg-background min-h-screen container mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">
          {(error as { message?: string })?.message || 'Không tải được hồ sơ. Vui lòng đăng nhập lại.'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const avatarSrc = me.avatar || undefined;
  const memberSince =
    me.clientProfile?.createdAt != null
      ? new Date(me.clientProfile.createdAt).toLocaleDateString('vi-VN', {
          month: 'long',
          year: 'numeric',
        })
      : new Date(me.createdAt).toLocaleDateString('vi-VN', {
          month: 'long',
          year: 'numeric',
        });

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Tài Khoản Của Tôi</h1>
          <p className="text-muted-foreground">Quản lý thông tin tài khoản và cài đặt</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {me.fullName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{me.fullName}</p>
                    <p className="text-sm text-muted-foreground">{me.email}</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Thông tin cá nhân</CardTitle>
                      <CardDescription>Quản lý thông tin hồ sơ của bạn</CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? 'primary' : 'outline'}
                      size="sm"
                      className="rounded-xl gap-1.5"
                      onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                    >
                      {isEditing ? (
                        <>
                          <Save className="h-4 w-4" />
                          Lưu
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4" />
                          Chỉnh sửa
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {me.fullName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{me.fullName}</h3>
                        <p className="text-sm text-muted-foreground">Thành viên từ {memberSince}</p>
                        <Badge variant="secondary" className="mt-1">
                          {me.role === 'CLIENT' ? 'Khách hàng' : me.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Họ và tên
                        </Label>
                        {isEditing ? (
                          <Input
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          />
                        ) : (
                          <p className="font-medium">{me.fullName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Label>
                        {isEditing ? (
                          <Input type="email" value={formData.email} disabled className="opacity-70" />
                        ) : (
                          <p className="font-medium">{me.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Email không đổi qua giao diện này</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Số điện thoại
                        </Label>
                        {isEditing ? (
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        ) : (
                          <p className="font-medium">{me.phone || '—'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Ngày tham gia
                        </Label>
                        <p className="font-medium">
                          {new Date(me.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
                    <span
                      className="inline-flex"
                      title={
                        !canManageAddresses
                          ? 'Chỉ tài khoản khách hàng có hồ sơ mới quản lý địa chỉ giao hàng.'
                          : undefined
                      }
                    >
                      <Button
                        size="sm"
                        className="rounded-xl gap-1.5"
                        type="button"
                        disabled={!canManageAddresses || createAddress.isPending}
                        onClick={openAddAddressDialog}
                      >
                        <Plus className="h-4 w-4" />
                        Thêm địa chỉ
                      </Button>
                    </span>
                  </div>

                  <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                      <form onSubmit={handleSubmitNewAddress}>
                        <DialogHeader>
                          <DialogTitle>Thêm địa chỉ giao hàng</DialogTitle>
                          <DialogDescription>
                            Điền thông tin người nhận và địa chỉ. Các trường có dấu * là bắt buộc.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="addr-fullName">Họ và tên *</Label>
                            <Input
                              id="addr-fullName"
                              value={newAddress.fullName}
                              onChange={(e) => setNewAddress((s) => ({ ...s, fullName: e.target.value }))}
                              autoComplete="name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addr-phone">Số điện thoại *</Label>
                            <Input
                              id="addr-phone"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress((s) => ({ ...s, phone: e.target.value }))}
                              autoComplete="tel"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addr-line">Địa chỉ chi tiết *</Label>
                            <Input
                              id="addr-line"
                              value={newAddress.addressLine}
                              onChange={(e) => setNewAddress((s) => ({ ...s, addressLine: e.target.value }))}
                              placeholder="Số nhà, đường, phường/xã…"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addr-district">Quận / huyện</Label>
                            <Input
                              id="addr-district"
                              value={newAddress.district}
                              onChange={(e) => setNewAddress((s) => ({ ...s, district: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addr-province">Tỉnh / thành *</Label>
                            <Input
                              id="addr-province"
                              value={newAddress.province}
                              onChange={(e) => setNewAddress((s) => ({ ...s, province: e.target.value }))}
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-input"
                              checked={newAddress.isDefault}
                              onChange={(e) => setNewAddress((s) => ({ ...s, isDefault: e.target.checked }))}
                            />
                            Đặt làm địa chỉ mặc định
                          </label>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddressDialogOpen(false)}
                            disabled={createAddress.isPending}
                          >
                            Hủy
                          </Button>
                          <Button type="submit" disabled={createAddress.isPending}>
                            {createAddress.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Đang lưu…
                              </>
                            ) : (
                              'Lưu địa chỉ'
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {addresses.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center text-muted-foreground">
                        {canManageAddresses
                          ? 'Chưa có địa chỉ giao hàng. Nhấn "Thêm địa chỉ" để tạo mới.'
                          : 'Địa chỉ giao hàng chỉ áp dụng cho tài khoản khách hàng.'}
                      </CardContent>
                    </Card>
                  ) : (
                    addresses.map((addr) => (
                      <Card key={addr.id}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{addr.fullName}</span>
                                {addr.isDefault && (
                                  <Badge variant="default" className="text-xs">
                                    Mặc định
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{addr.phone}</p>
                              <p className="text-sm text-muted-foreground">
                                {addr.addressLine}
                                {addr.district ? `, ${addr.district}` : ''}, {addr.province}
                              </p>
                            </div>
                            {canManageAddresses && (
                              <div className="flex flex-wrap gap-1 items-center shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" type="button" disabled>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {!addr.isDefault && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-lg text-xs"
                                      type="button"
                                      disabled={setDefaultAddress.isPending}
                                      onClick={() => setDefaultAddress.mutate(addr.id)}
                                    >
                                      Mặc định
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      type="button"
                                      disabled={deleteAddress.isPending}
                                      onClick={() => {
                                        if (!window.confirm('Xóa địa chỉ này?')) return;
                                        deleteAddress.mutate(addr.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cài đặt thông báo</CardTitle>
                    <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      {
                        label: 'Thông báo đơn hàng',
                        desc: 'Nhận thông báo khi đơn hàng thay đổi trạng thái',
                        defaultChecked: true,
                      },
                      {
                        label: 'Khuyến mãi & Ưu đãi',
                        desc: 'Nhận thông báo về khuyến mãi đặc biệt',
                        defaultChecked: true,
                      },
                      {
                        label: 'Đánh giá sản phẩm',
                        desc: 'Nhận email nhắc đánh giá sau khi nhận hàng',
                        defaultChecked: false,
                      },
                      {
                        label: 'Tin tức Farmers',
                        desc: 'Cập nhật sản phẩm mới và câu chuyện nguồn gốc',
                        defaultChecked: false,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start justify-between gap-4 pb-4 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={item.defaultChecked}
                          />
                          <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Đổi mật khẩu</CardTitle>
                      <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pwd-current">Mật khẩu hiện tại</Label>
                          <div className="relative">
                            <Input
                              id="pwd-current"
                              type={showCurrent ? 'text' : 'password'}
                              value={pwdForm.current}
                              onChange={(e) => setPwdForm((s) => ({ ...s, current: e.target.value }))}
                              placeholder="Nhập mật khẩu hiện tại"
                              className="pr-10"
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowCurrent((v) => !v)}
                            >
                              {showCurrent ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pwd-next">Mật khẩu mới</Label>
                          <div className="relative">
                            <Input
                              id="pwd-next"
                              type={showNext ? 'text' : 'password'}
                              value={pwdForm.next}
                              onChange={(e) => setPwdForm((s) => ({ ...s, next: e.target.value }))}
                              placeholder="Ít nhất 6 ký tự, chữ in hoa đầu, 1 ký tự đặc biệt"
                              className="pr-10"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowNext((v) => !v)}
                            >
                              {showNext ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pwd-confirm">Xác nhận mật khẩu mới</Label>
                          <div className="relative">
                            <Input
                              id="pwd-confirm"
                              type={showConfirm ? 'text' : 'password'}
                              value={pwdForm.confirm}
                              onChange={(e) => setPwdForm((s) => ({ ...s, confirm: e.target.value }))}
                              placeholder="Nhập lại mật khẩu mới"
                              className="pr-10"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowConfirm((v) => !v)}
                            >
                              {showConfirm ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="rounded-xl"
                          disabled={changePassword.isPending || !pwdForm.current || !pwdForm.next || !pwdForm.confirm}
                        >
                          {changePassword.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Đang xử lý…
                            </>
                          ) : (
                            'Cập nhật mật khẩu'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/30">
                    <CardHeader>
                      <CardTitle className="text-destructive">Xóa tài khoản</CardTitle>
                      <CardDescription>
                        Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="destructive"
                        className="rounded-xl"
                        type="button"
                        disabled={deleteAccount.isPending}
                        onClick={() => {
                          if (!window.confirm('Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.')) return;
                          deleteAccount.mutate();
                        }}
                      >
                        {deleteAccount.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Đang xóa…
                          </>
                        ) : (
                          'Xóa tài khoản'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
