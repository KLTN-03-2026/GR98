import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authApi } from "@/client/api/auth/auth-api";
import type { ApiError } from "@/client/types";
import { toast } from "sonner";
import { AuthSplitShell } from "@/pages/auth/auth-split-shell";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "Mật khẩu mới là bắt buộc")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .regex(/^[A-Z]/, "Ký tự đầu tiên phải là chữ cái in hoa")
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const watchNewPassword = form.watch("newPassword");

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Token không hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.newPassword);
      setIsSuccess(true);
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: "Yếu", color: "bg-red-500" };
    if (score <= 4) return { level: 2, label: "Trung bình", color: "bg-yellow-500" };
    return { level: 3, label: "Mạnh", color: "bg-green-500" };
  };

  const strength = getPasswordStrength(watchNewPassword || "");

  if (!token) {
    return (
      <AuthSplitShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto w-full min-w-0 max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Link không hợp lệ
          </h2>
          <p className="mb-6 text-muted-foreground">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Button
            onClick={() => navigate("/auth/forgot-password")}
            variant="outline"
            className="w-full rounded-xl"
          >
            Yêu cầu link mới
          </Button>
        </motion.div>
      </AuthSplitShell>
    );
  }

  if (isSuccess) {
    return (
      <AuthSplitShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto w-full min-w-0 max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Đặt lại mật khẩu thành công
          </h2>
          <p className="mb-6 text-muted-foreground">
            Mật khẩu của bạn đã được cập nhật.
            Bây giờ bạn có thể đăng nhập với mật khẩu mới.
          </p>
          <Button
            onClick={() => navigate("/auth/login")}
            variant="primary"
            className="w-full rounded-xl"
          >
            Đăng nhập ngay
          </Button>
        </motion.div>
      </AuthSplitShell>
    );
  }

  return (
    <AuthSplitShell>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[var(--secondary)]/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-[var(--primary)]/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mx-auto w-full min-w-0 max-w-md"
      >
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Mật khẩu mới
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Mật khẩu mới"
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-dashed pl-10 pr-10 focus:border-[var(--primary)]"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchNewPassword && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <div
                    className={`h-1 flex-1 rounded-full ${strength.level >= 1 ? strength.color : "bg-gray-200"}`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full ${strength.level >= 2 ? strength.color : "bg-gray-200"}`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full ${strength.level >= 3 ? strength.color : "bg-gray-200"}`}
                  />
                </div>
                <p className={`text-xs ${strength.color.replace("bg-", "text-")}`}>
                  Độ mạnh: {strength.label}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Xác nhận mật khẩu
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-dashed pl-10 pr-10 focus:border-[var(--primary)]"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-dashed bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Yêu cầu mật khẩu:</strong>
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                <li>• Ít nhất 6 ký tự</li>
                <li>• Ký tự đầu tiên phải là chữ in hoa</li>
                <li>• Ít nhất 1 ký tự đặc biệt</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="h-11 w-full rounded-3xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
            >
              {isLoading ? (
                <span className="animate-pulse">Đang xử lý...</span>
              ) : (
                "Xác nhận đặt lại mật khẩu"
              )}
            </Button>
          </form>
        </Form>
      </motion.div>
    </AuthSplitShell>
  );
}
