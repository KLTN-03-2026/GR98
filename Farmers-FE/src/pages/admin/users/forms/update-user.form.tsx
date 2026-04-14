'use client';
import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  FileUserIcon,
  VoicemailIcon,
  UserIcon,
  ShieldCheckIcon,
  MapPinIcon,
  Building2Icon,
  MapIcon,
  ToggleLeftIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { userApi, type UserResponse } from '@/client/lib/api-client';
import { userCreateFormSchema, type UserCreateFormInput } from '@/pages/admin/users/validation/create-user.validation';
import FileUpload from '@/components/custom/file-upload';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface UpdateUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
  onSuccess?: () => void;
}

export default function UpdateUserForm({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UpdateUserFormProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);

  const form = useForm<UserCreateFormInput>({
    resolver: zodResolver(userCreateFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: undefined,
      status: undefined,
      province: '',
      businessName: '',
      defaultAddress: '',
      avatar: undefined,
    },
  });

  // Populate form when user changes
  useEffect(() => {
    if (open && user) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? '',
        role: user.role,
        password: '',
        province: user.adminProfile?.province ?? '',
        businessName: user.adminProfile?.businessName ?? '',
        defaultAddress: user.clientProfile?.defaultAddress ?? '',
        avatar: undefined,
      });
      setSelectedRole(user.role);
    }
  }, [open, user, form]);

  async function onSubmit(values: UserCreateFormInput) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};

      if (values.fullName !== user.fullName) payload.fullName = values.fullName;
      if (values.email !== user.email) payload.email = values.email;
      if ((values.phone ?? '') !== (user.phone ?? '')) payload.phone = values.phone || undefined;
      if (values.password) payload.password = values.password;
      if (values.role && values.role !== user.role) payload.role = values.role;
      if (values.status) payload.status = values.status;

      // Handle avatar
      if (values.avatar instanceof File) {
        payload.avatar = await fileToBase64(values.avatar);
      } else if (values.avatar === null && user.avatar) {
        // User removed avatar
        payload.clearAvatar = true;
      }

      if (values.role === 'ADMIN') {
        if (values.businessName !== (user.adminProfile?.businessName ?? ''))
          payload.businessName = values.businessName;
        if (values.province !== (user.adminProfile?.province ?? ''))
          payload.province = values.province;
      }

      if (values.role === 'CLIENT') {
        if (values.defaultAddress !== (user.clientProfile?.defaultAddress ?? ''))
          payload.defaultAddress = values.defaultAddress;
        if (values.province !== (user.clientProfile?.province ?? ''))
          payload.province = values.province;
      }

      if (Object.keys(payload).length === 0) {
        toast.info('Không có thay đổi nào để lưu');
        onOpenChange(false);
        return;
      }

      await userApi.update(user.id, payload);
      toast.success('Cập nhật người dùng thành công!');
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string }; message?: string }>;
      const message =
        axiosErr.response?.data?.error?.message ||
        axiosErr.message ||
        'Cập nhật thất bại';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && open && form.formState.isDirty) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(newOpen);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col overflow-hidden">
          <SheetHeader className="border-b px-1">
            <SheetTitle className="text-lg">Cập nhật người dùng</SheetTitle>
            <SheetDescription className="text-sm">
              Chỉnh sửa thông tin người dùng — bỏ trống trường không muốn thay đổi
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onReset={() => form.reset()}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-1">
                <div className="space-y-6 py-4">

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <FileUserIcon className="size-3.5" />
                          Họ tên
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nguyễn Văn A" autoComplete="off" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <VoicemailIcon className="size-3.5" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="nguyenvana@email.com" type="email" autoComplete="off" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <UserIcon className="size-3.5" />
                          Số điện thoại
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0123456789" type="tel" autoComplete="off" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password — chỉ update khi nhập */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ShieldCheckIcon className="size-3.5" />
                          Mật khẩu mới
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Để trống nếu không đổi mật khẩu"
                            type="password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ShieldCheckIcon className="size-3.5" />
                          Vai trò
                        </FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            setSelectedRole(val);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ADMIN">Quản trị viên (Admin)</SelectItem>
                            <SelectItem value="SUPERVISOR">Giám sát viên (Supervisor)</SelectItem>
                            <SelectItem value="INVENTORY">Nhân viên kho (Inventory)</SelectItem>
                            <SelectItem value="CLIENT">Khách hàng (Client)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ToggleLeftIcon className="size-3.5" />
                          Trạng thái
                        </FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Hoạt động (Active)</SelectItem>
                            <SelectItem value="INACTIVE">Không hoạt động (Inactive)</SelectItem>
                            <SelectItem value="SUSPENDED">Tạm ngưng (Suspended)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Avatar */}
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ảnh đại diện</FormLabel>
                        <FormControl>
                          <FileUpload
                            onFileSelect={(file) => field.onChange(file)}
                            onFileError={(error) => {
                              console.warn('[UpdateUserForm] Avatar error:', error);
                              toast.error(error || 'Ảnh đại diện không hợp lệ');
                              form.setError('avatar', { type: 'manual', message: error });
                            }}
                            onFileRemove={() => field.onChange(null)}
                            currentFile={field.value ?? null}
                            maxFileSize={5 * 1024 * 1024}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ── ADMIN-only fields ─────────────────────────────────────── */}
                  {selectedRole === 'ADMIN' && (
                    <>
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <Building2Icon className="size-3.5" />
                              Tên doanh nghiệp
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Công ty TNHH Nông Sản Xanh" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <MapPinIcon className="size-3.5" />
                              Tỉnh / Thành phố
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Hà Nội" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* ── CLIENT-only fields ─────────────────────────────────────── */}
                  {selectedRole === 'CLIENT' && (
                    <>
                      <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <MapPinIcon className="size-3.5" />
                              Tỉnh / Thành phố
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="TP. Hồ Chí Minh" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="defaultAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <MapIcon className="size-3.5" />
                              Địa chỉ mặc định
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="123 Đường ABC, Quận 1, TP.HCM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                </div>
              </div>

              <SheetFooter className="border-t px-1 pt-4 flex-shrink-0">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirmDialog} onOpenChange={(d) => !d && setShowConfirmDialog(false)}>
        <AlertDialogContent variant="error">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đóng biểu mẫu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng biểu mẫu không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                form.reset();
                onOpenChange(false);
              }}
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
