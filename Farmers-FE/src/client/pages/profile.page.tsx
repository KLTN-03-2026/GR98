import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMockProfile } from '@/client/hooks/use-mock-queries';

type TabKey = 'profile' | 'address' | 'notifications' | 'security';

const TABS = [
  { key: 'profile' as const, label: 'Hồ sơ', icon: User },
  { key: 'address' as const, label: 'Địa chỉ', icon: MapPin },
  { key: 'notifications' as const, label: 'Thông báo', icon: Bell },
  { key: 'security' as const, label: 'Bảo mật', icon: CreditCard },
];

// Mock addresses
const MOCK_ADDRESSES = [
  {
    id: 'addr-1',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '123 Nguyễn Trãi, Phường 5',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    isDefault: true,
  },
  {
    id: 'addr-2',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '456 Lê Lợi, Phường 3',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    isDefault: false,
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const { data: profile } = useMockProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });

  const handleSaveProfile = () => {
    // Save logic here
    setIsEditing(false);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Tài Khoản Của Tôi</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin tài khoản và cài đặt
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={profile?.avatarUrl} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {profile?.fullName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>

                {/* Tabs */}
                <nav className="space-y-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
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

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Thông tin cá nhân</CardTitle>
                      <CardDescription>Quản lý thông tin hồ sơ của bạn</CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-xl gap-1.5"
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
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
                        <AvatarImage src={profile?.avatarUrl} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {profile?.fullName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{profile?.fullName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Thành viên từ{' '}
                          {profile?.clientProfile?.createdAt
                            ? new Date(profile.clientProfile.createdAt).toLocaleDateString('vi-VN', {
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'năm 2024'}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          Khách hàng
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
                          <p className="font-medium">{profile?.fullName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        ) : (
                          <p className="font-medium">{profile?.email}</p>
                        )}
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
                          <p className="font-medium">{profile?.phone}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Ngày tham gia
                        </Label>
                        <p className="font-medium">
                          {profile?.clientProfile?.createdAt
                            ? new Date(profile.clientProfile.createdAt).toLocaleDateString('vi-VN')
                            : '01/01/2024'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
                    <Button size="sm" className="rounded-xl gap-1.5">
                      <Plus className="h-4 w-4" />
                      Thêm địa chỉ
                    </Button>
                  </div>
                  {MOCK_ADDRESSES.map((addr) => (
                    <Card key={addr.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{addr.fullName}</span>
                              {addr.isDefault && (
                                <Badge variant="default" className="text-xs">Mặc định</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{addr.phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {addr.address}, {addr.district}, {addr.province}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!addr.isDefault && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cài đặt thông báo</CardTitle>
                    <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { label: 'Thông báo đơn hàng', desc: 'Nhận thông báo khi đơn hàng thay đổi trạng thái', defaultChecked: true },
                      { label: 'Khuyến mãi & Ưu đãi', desc: 'Nhận thông báo về khuyến mãi đặc biệt', defaultChecked: true },
                      { label: 'Đánh giá sản phẩm', desc: 'Nhận email nhắc đánh giá sau khi nhận hàng', defaultChecked: false },
                      { label: 'Tin tức Farmers', desc: 'Cập nhật sản phẩm mới và câu chuyện nguồn gốc', defaultChecked: false },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultChecked} />
                          <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Đổi mật khẩu</CardTitle>
                      <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Mật khẩu hiện tại</Label>
                        <div className="relative">
                          <Input type="password" placeholder="Nhập mật khẩu hiện tại" className="pr-10" />
                          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <EyeOff className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mật khẩu mới</Label>
                        <div className="relative">
                          <Input type="password" placeholder="Nhập mật khẩu mới" className="pr-10" />
                          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Xác nhận mật khẩu mới</Label>
                        <Input type="password" placeholder="Nhập lại mật khẩu mới" />
                      </div>
                      <Button className="rounded-xl">Cập nhật mật khẩu</Button>
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
                      <Button variant="destructive" className="rounded-xl">
                        Xóa tài khoản
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
