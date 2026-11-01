"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  RotateCw,
  ShieldCheck,
  Stethoscope,
  User,
  UserCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  formatAuthError,
  useGetCurrentUserQuery,
  useLoginMutation,
} from "../services/authApi";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const DEMO_PRESETS = [
  {
    role: "Bác sĩ",
    email: "seed-gen-01@example.invalid",
    icon: Stethoscope,
    badge: "BS. Minh An",
  },
  {
    role: "Lễ tân",
    email: "receptionist01@example.invalid",
    icon: UserCheck,
    badge: "Lễ tân 01",
  },
  {
    role: "Quản trị viên",
    email: "admin01@example.invalid",
    icon: ShieldCheck,
    badge: "Admin 01",
  },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const { data: currentUser, refetch: refetchCurrentUser } =
    useGetCurrentUserQuery();

  const getPostLoginDestination = (role: string) => {
    if (redirectParam && redirectParam.startsWith("/")) {
      return redirectParam;
    }
    switch (role) {
      case "DOCTOR":
        return "/examinations";
      case "RECEPTIONIST":
        return "/reception";
      case "ADMIN":
      default:
        return "/doctors";
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== "PATIENT") {
      router.replace(getPostLoginDestination(currentUser.role));
    }
  }, [currentUser, router]);

  const handleDemoFill = (email: string) => {
    setIdentifier(email);
    setPassword("123456");
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage("Vui lòng điền đầy đủ tài khoản và mật khẩu.");
      return;
    }

    setErrorMessage("");

    try {
      await login({
        identifier: identifier.trim(),
        password,
        rememberMe,
      }).unwrap();

      // Fetch the authenticated user's profile to inspect role
      const userRes = await refetchCurrentUser();
      const user = userRes.data;

      if (user?.role === "PATIENT") {
        setErrorMessage(
          "Tài khoản người bệnh không có quyền truy cập hệ thống nhân sự y tế."
        );
        return;
      }

      toast.success(
        `Đăng nhập thành công! Chào mừng ${user?.name || "bạn"}.`
      );

      const targetPath = getPostLoginDestination(user?.role || "ADMIN");
      router.replace(targetPath);
    } catch (err) {
      setErrorMessage(
        formatAuthError(
          err,
          "Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại."
        )
      );
    }
  };

  return (
    <div className="flex w-full flex-col justify-center p-5 sm:p-7 lg:p-8">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        {/* Header */}
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

        {/* Demo Fast-Fill Selector (seeded staff accounts) */}
        <div className="mt-4 rounded-app-lg border border-border bg-background/60 p-2.5">
          <span className="text-label font-bold uppercase tracking-wider text-muted">
            Tài khoản mẫu đã seed:
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {DEMO_PRESETS.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleDemoFill(demo.email)}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-app-md border border-border bg-surface p-1.5 text-center transition hover:border-primary hover:bg-item-hover"
                >
                  <Icon className="size-3.5 text-primary" />
                  <span className="text-caption font-bold text-foreground leading-tight">
                    {demo.role}
                  </span>
                  <span className="text-[10px] text-muted leading-tight">
                    {demo.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-3 rounded-app-md border border-error-border bg-error-bg p-2.5 text-caption font-medium text-error"
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
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
                placeholder="admin01@example.invalid"
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
                onClick={() => setIsForgotModalOpen(true)}
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

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-caption text-muted select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-3.5 rounded border-border-strong text-primary accent-primary"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
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

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialIdentifier={identifier}
      />
    </div>
  );
}
