"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, RotateCw, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  formatAuthError,
  useGetAuthUserQuery,
  useLazyGetAuthUserQuery,
  useLogoutMutation,
  useLoginMutation,
} from "../services/authApi";
import { useModal } from "@/hooks/useModal";
import { getPostLoginDestination, isStaffRole } from "../authRoutes";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const forgotModal = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [login] = useLoginMutation();
  const [logout] = useLogoutMutation();
  const [loadAuthUser] = useLazyGetAuthUserQuery();
  const {
    data: currentUser,
    isFetching: isCheckingSession,
    error: sessionError,
  } = useGetAuthUserQuery(undefined, {
    skip: isSubmitting,
    refetchOnMountOrArgChange: true,
  });
  const isLoggingIn = isSubmitting || isCheckingSession;

  useEffect(() => {
    if (
      !isSubmitting &&
      !isCheckingSession &&
      !sessionError &&
      isStaffRole(currentUser?.role)
    ) {
      router.replace(getPostLoginDestination(currentUser.role, redirectParam));
    }
  }, [
    currentUser,
    isSubmitting,
    isCheckingSession,
    sessionError,
    redirectParam,
    router,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoggingIn) return;
    if (!identifier.trim() || !password) {
      setErrorMessage("Vui lòng điền đầy đủ tài khoản và mật khẩu.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await login({ identifier: identifier.trim(), password }).unwrap();
      const user = await loadAuthUser(undefined, false).unwrap();
      if (!isStaffRole(user.role)) {
        await logout().unwrap();
        setErrorMessage(
          "Tài khoản này không có quyền truy cập cổng nhân sự y tế.",
        );
        return;
      }
      toast.success(`Đăng nhập thành công! Chào mừng ${user.name || "bạn"}.`);
      router.replace(getPostLoginDestination(user.role, redirectParam));
    } catch (error) {
      setErrorMessage(
        formatAuthError(
          error,
          "Không thể xác thực phiên đăng nhập. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center p-5 sm:p-7 lg:p-8">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-app-md bg-primary-light px-2 py-0.5 text-label font-bold text-primary">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span>CỔNG NHÂN SỰ Y TẾ</span>
          </div>

          <h2 className="text-heading font-extrabold tracking-tight text-foreground sm:text-title">
            Đăng nhập hệ thống
          </h2>
          <p className="text-caption text-muted">
            Vui lòng nhập tài khoản công tác để truy cập phân hệ làm việc.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-3 rounded-app-md border border-error-border bg-error-bg p-2.5 text-caption font-medium text-error"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="identifier"
              className="text-caption font-bold text-foreground"
            >
              Email hoặc Số điện thoại
            </label>
            <div className="relative">
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="Nhập email hoặc số điện thoại"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoggingIn}
                className="pl-9 h-9 text-caption"
              />
              <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-caption font-bold text-foreground"
              >
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => forgotModal.open()}
                disabled={isLoggingIn}
                className="text-caption font-semibold text-primary hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                className="pl-9 pr-9 h-9 text-caption"
              />
              <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <button
                type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoggingIn || !identifier.trim() || !password}
            className="w-full h-9 text-caption font-bold mt-1"
          >
            {isLoggingIn ? (
              <>
                <RotateCw className="size-3.5 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập hệ thống</span>
            )}
          </Button>
        </form>
      </div>

      {forgotModal.isOpen && (
        <ForgotPasswordModal
          isOpen
          onClose={forgotModal.close}
          initialIdentifier={identifier}
        />
      )}
    </div>
  );
}
