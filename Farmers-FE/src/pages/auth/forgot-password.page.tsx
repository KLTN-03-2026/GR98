import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
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
import { authApi } from "@/client/lib/api-client";
import type { ApiError } from "@/client/types";
import { toast } from "sonner";
import { AuthSplitShell } from "@/pages/auth/auth-split-shell";
import { AppLogo } from "@/components/global/app-logo";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthSplitShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto w-full min-w-0 max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Kiểm tra email của bạn
          </h2>
          <p className="mb-6 text-muted-foreground">
            Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.
            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
          </p>
          <div className="mb-6 rounded-lg border border-dashed bg-muted/50 p-4 text-left">
            <p className="text-sm text-muted-foreground">
              <strong>Lưu ý:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Link sẽ hết hạn sau <strong>1 giờ</strong></li>
              <li>• Kiểm tra cả thư mục Spam nếu không thấy email</li>
              <li>• Nếu không nhận được email, hãy thử gửi lại</li>
            </ul>
          </div>
          <Button
            onClick={() => navigate("/auth/login")}
            variant="outline"
            className="w-full rounded-xl"
          >
            Quay về đăng nhập
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
          <Link
            to="/auth/login"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[var(--secondary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về đăng nhập
          </Link>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Quên mật khẩu
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập email của bạn để nhận link đặt lại mật khẩu
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
                    Email của bạn
                    <span className="ml-0.5 text-[var(--primary)]">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="nguyenvana@email.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        className="h-11 rounded-xl border-dashed pl-10 focus:border-[var(--primary)]"
                        {...field}
                      />
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
              className="group h-11 w-full rounded-3xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
            >
              {isLoading ? (
                <span className="animate-pulse">Đang gửi...</span>
              ) : (
                <>
                  Gửi link đặt lại mật khẩu
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Nhớ mật khẩu rồi?{" "}
          <Link
            to="/auth/login"
            className="font-semibold text-[var(--primary)] hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </motion.div>
    </AuthSplitShell>
  );
}
