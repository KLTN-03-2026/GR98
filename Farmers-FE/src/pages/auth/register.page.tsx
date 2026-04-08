import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Circle } from "lucide-react";
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
import { useAuthStore } from "@/client/store";
import { toast } from "sonner";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/cookie-utils";
import { AuthSplitShell } from "@/pages/auth/auth-split-shell";

// ============================================================
// VALIDATION SCHEMA
// ============================================================
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Họ tên là bắt buộc")
      .min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(1, "Mật khẩu là bắt buộc")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .regex(/^[A-Z]/, "Ký tự đầu tiên phải là chữ cái in hoa")
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================
// REGISTER PAGE
// ============================================================
export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = form.watch("password") || "";
  const passwordChecks = [
    {
      label: "Tối thiểu 6 ký tự",
      isValid: passwordValue.length >= 6,
    },
    {
      label: "Ký tự đầu tiên là chữ in hoa",
      isValid: /^[A-Z]/.test(passwordValue),
    },
    {
      label: "Có ít nhất 1 ký tự đặc biệt",
      isValid: /[^A-Za-z0-9]/.test(passwordValue),
    },
  ];

  const passedChecks = passwordChecks.filter((check) => check.isValid).length;
  const passwordStrengthPercent = (passedChecks / passwordChecks.length) * 100;
  const passwordStrengthText =
    passedChecks === 0
      ? "Chưa an toàn"
      : passedChecks === 1
        ? "Yếu"
        : passedChecks === 2
          ? "Trung bình"
          : "Mạnh";

  const passwordStrengthClass =
    passedChecks <= 1
      ? "bg-red-500/80"
      : passedChecks === 2
        ? "bg-amber-500/80"
        : "bg-emerald-500/80";

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || undefined,
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

      toast.success("Đăng ký thành công! Chào mừng bạn đến với Farmers.");

      navigate("/");
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
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
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Tạo tài khoản{" "}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              Vietnam Farmer
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Điền thông tin để bắt đầu{" "}
            <span className="font-medium text-[var(--secondary)]">
              mua sắm nông sản
            </span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Họ và tên{" "}
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Email{" "}
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="nguyenvana@email.com"
                      autoComplete="email"
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Số điện thoại{" "}
                    <span className="font-normal text-muted-foreground">
                      (tùy chọn)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="0901234567"
                      autoComplete="tel"
                      className="h-11 rounded-xl border-dashed focus:border-[var(--primary)]"
                      {...field}
                      value={field.value || ""}
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
                        placeholder="Ít nhất 6 ký tự"
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-dashed pr-10 focus:border-[var(--primary)]"
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
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
                  <div className="mt-2 rounded-xl border border-dashed border-primary/20 bg-linear-to-r from-(--primary)/5 via-transparent to-(--secondary)/5 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground/85">
                        Độ bảo mật mật khẩu
                      </span>
                      <span className="font-semibold text-secondary">
                        {passwordStrengthText}
                      </span>
                    </div>
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
                      <motion.div
                        className={`h-full rounded-full transition-colors ${passwordStrengthClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrengthPercent}%` }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>
                    <ul className="space-y-1.5 text-xs">
                      {passwordChecks.map((check) => (
                        <li
                          key={check.label}
                          className={`flex items-center gap-2 transition-colors ${check.isValid
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                            }`}
                        >
                          {check.isValid ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          <span>{check.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Xác nhận mật khẩu{" "}
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-dashed pr-10 focus:border-[var(--primary)]"
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label={
                          showConfirm
                            ? "Ẩn xác nhận mật khẩu"
                            : "Hiện xác nhận mật khẩu"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? (
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

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="group mt-2 h-11 w-full rounded-3xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
            >
              {isLoading ? (
                <span className="animate-pulse">Đang đăng ký...</span>
              ) : (
                <>
                  Tạo tài khoản
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link
                to="/auth/login"
                className="font-semibold text-[var(--primary)] hover:underline"
              >
                Đăng nhập ngay
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
