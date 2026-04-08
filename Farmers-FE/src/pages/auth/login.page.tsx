import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
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
import {
  authApi,
  extractData,
  type AuthUserResponse,
} from "@/client/lib/api-client";
import type { ApiError } from "@/client/types";
import { useAuthStore } from "@/client/store";
import { toast } from "sonner";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/cookie-utils";
import { AuthSplitShell } from "@/pages/auth/auth-split-shell";
import { AppLogo } from "@/components/global/app-logo";

// ============================================================
// VALIDATION SCHEMA — hỗ trợ cả email và phone
// ============================================================
const loginSchema = z.object({
  email: z.string().min(1, "Email hoặc số điện thoại là bắt buộc"),
  password: z
    .string()
    .min(1, "Mật khẩu là bắt buộc")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================
// LOGIN PAGE
// ============================================================
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const isEmail = data.email.includes("@");
      const response = await authApi.login({
        ...(isEmail ? { email: data.email } : { phone: data.email }),
        password: data.password,
      });

      const { accessToken, refreshToken, user } = extractData<{
        accessToken: string;
        refreshToken: string;
        user: AuthUserResponse;
      }>(response);

      setAccessTokenCookie(accessToken);
      setRefreshTokenCookie(refreshToken);

      login(
        {
          id: user.profileId,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone ?? undefined,
          role: user.role,
          status: "ACTIVE",
          accessToken,
        },
        accessToken,
        refreshToken,
      );

      toast.success("Đăng nhập thành công!");

      if (user.role === "ADMIN") {
        navigate("/dashboard");
      } else if (user.role === "SUPERVISOR") {
        navigate("/supervisor");
      } else {
        navigate("/");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || 'Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitShell>
      {/* Decorative blobs — nổi bật với base palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[var(--secondary)]/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-[var(--tertiary)]/8 blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mx-auto w-full min-w-0 max-w-md"
      >
        {/* Brand mark */}

        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Đăng nhập{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              Farmers
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Truy cập hệ thống{" "}
            <span className="font-medium text-[var(--secondary)]">
              quản lý nông sản
            </span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Nhập vào Email của bạn{" "}
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="nguyenvana@email.com"
                      autoComplete="username"
                      autoCapitalize="none"
                      className="h-11 rounded-xl border-dashed focus:border-[var(--primary)]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Mật khẩu{" "}
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-11 rounded-xl border-dashed pr-10 focus:border-[var(--primary)]"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
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

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-[var(--primary)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-muted-foreground">Ghi nhớ đăng nhập</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="font-medium text-[var(--secondary)] hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="group h-11 w-full rounded-3xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
            >
              {isLoading ? (
                <span className="animate-pulse">Đang đăng nhập...</span>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  hoặc
                </span>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                to="/auth/register"
                className="font-semibold text-[var(--primary)] hover:underline"
              >
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-[var(--secondary)]"
          >
            ← Quay về trang chủ
          </Link>
        </div>
      </motion.div>
    </AuthSplitShell>
  );
}
