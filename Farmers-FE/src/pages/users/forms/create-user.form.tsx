'use client';
import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
import {
  FileUserIcon,
  VoicemailIcon,
  UserIcon,
  ShieldCheckIcon,
  MapIcon,
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
import { userCreateFormSchema, type UserCreateFormInput } from '@/pages/users/validation/create-user.validation';
import { userApi } from '@/client/lib/api-client';
import FileUpload from '@/components/custom/file-upload';

interface CreateUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateUserForm({ open, onOpenChange, onSuccess }: CreateUserFormProps) {
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
      province: '',
      businessName: '',
      defaultAddress: '',
      avatar: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      form.clearErrors();
      setSelectedRole(undefined);
    }
  }, [open, form]);

  async function onSubmit(values: UserCreateFormInput) {
    setIsSubmitting(true);
    try {
      // Convert File to Base64 data URL
      let avatarBase64: string | undefined;
      if (values.avatar instanceof File) {
        avatarBase64 = await fileToBase64(values.avatar);
      }

      const payload = {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
        role: values.role as 'ADMIN' | 'SUPERVISOR' | 'CLIENT',
        ...(avatarBase64 && { avatar: avatarBase64 }),
        ...(values.role === 'CLIENT' && {
          defaultAddress: values.defaultAddress,
        }),
      };

      await userApi.create(payload);
      toast.success('Tạo người dùng thành công!');
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string }; message?: string }>;
      const message =
        axiosErr.response?.data?.error?.message ||
        axiosErr.message ||
        'Tạo người dùng thất bại';
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
            <SheetTitle className="text-lg">Thêm người dùng mới</SheetTitle>
            <SheetDescription className="text-sm">
              Điền thông tin để thêm người dùng vào hệ thống
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
                          Họ tên <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nguyễn Văn A"
                            autoComplete="off"
                            {...field}
                          />
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
                          Email <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="nguyenvana@email.com"
                            type="email"
                            autoComplete="off"
                            {...field}
                          />
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
                          <Input
                            placeholder="0123456789"
                            type="tel"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ShieldCheckIcon className="size-3.5" />
                          Mật khẩu <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Role */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ShieldCheckIcon className="size-3.5" />
                          Vai trò <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            setSelectedRole(val);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ADMIN">Quản trị viên (Admin)</SelectItem>
                            <SelectItem value="SUPERVISOR">Giám sát viên (Supervisor)</SelectItem>
                            <SelectItem value="CLIENT">Khách hàng (Client)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ── CLIENT-only fields ─────────────────────────────────────── */}
                  {selectedRole === 'CLIENT' && (
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
                  )}

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
                              console.warn('[CreateUserForm] Avatar error:', error);
                              toast.error(error || 'Ảnh đại diện không hợp lệ');
                              form.setError('avatar', { type: 'manual', message: error });
                            }}
                            currentFile={field.value ?? null}
                            maxFileSize={5 * 1024 * 1024}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <SheetFooter className="border-t px-1 pt-4 shrink-0">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo người dùng'}
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
              Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng biểu mẫu không? Mọi thay đổi sẽ bị mất.
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
