"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RotateCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  formatAuthError,
  useForgotPasswordMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
} from "../services/authApi";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
}

type Step = "IDENTIFIER" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

interface FormContentProps {
  onClose: () => void;
  initialIdentifier: string;
}

function ForgotPasswordFormContent({
  onClose,
  initialIdentifier,
}: FormContentProps) {
  const [step, setStep] = useState<Step>("IDENTIFIER");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const [forgotPassword, { isLoading: isSendingIdentifier }] =
    useForgotPasswordMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage("Vui lòng nhập email hoặc số điện thoại tài khoản.");
      return;
    }
    setErrorMessage("");

    try {
      const res = await forgotPassword({
        identifier: identifier.trim(),
      }).unwrap();
      setChallengeId(res.challengeId);
      setDevCode(res.developmentCode);
      setCountdown(res.retryAfter || 60);
      setStep("OTP");
      toast.success(
        "Mã xác thực đã được gửi. Vui lòng kiểm tra hộp thư/tin nhắn."
      );
    } catch (err) {
      setErrorMessage(
        formatAuthError(
          err,
          "Không thể gửi mã xác thực. Vui lòng kiểm tra lại thông tin."
        )
      );
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setErrorMessage("");
    try {
      const res = await resendOtp({ identifier: identifier.trim() }).unwrap();
      setChallengeId(res.challengeId);
      setDevCode(res.developmentCode);
      setCountdown(res.retryAfter || 60);
      toast.success("Đã gửi lại mã OTP mới.");
    } catch (err) {
      setErrorMessage(formatAuthError(err, "Không thể gửi lại mã OTP."));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorMessage("Vui lòng nhập đầy đủ mã OTP.");
      return;
    }
    setErrorMessage("");

    try {
      const res = await verifyOtp({
        challengeId,
        otp: otp.trim(),
      }).unwrap();

      if (!res.resetToken) {
        throw new Error("Không nhận được token đặt lại mật khẩu từ hệ thống.");
      }
      setResetToken(res.resetToken);
      setStep("NEW_PASSWORD");
    } catch (err) {
      setErrorMessage(
        formatAuthError(err, "Mã OTP không hợp lệ hoặc đã hết hạn.")
      );
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Xác nhận mật khẩu mới không khớp.");
      return;
    }
    setErrorMessage("");

    try {
      await resetPassword({
        resetToken,
        password,
      }).unwrap();
      setStep("SUCCESS");
      toast.success("Đặt lại mật khẩu thành công!");
    } catch (err) {
      setErrorMessage(formatAuthError(err, "Không thể đặt lại mật khẩu."));
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 text-primary">
          <KeyRound className="size-5" />
          <DialogTitle>
            {step === "SUCCESS"
              ? "Thành công"
              : step === "NEW_PASSWORD"
              ? "Đặt lại mật khẩu mới"
              : step === "OTP"
              ? "Nhập mã xác thực OTP"
              : "Quên mật khẩu nhân viên"}
          </DialogTitle>
        </div>
        <DialogDescription>
          {step === "SUCCESS"
            ? "Mật khẩu của bạn đã được cập nhật thành công."
            : step === "NEW_PASSWORD"
            ? "Tạo mật khẩu an toàn mới cho tài khoản công tác của bạn."
            : step === "OTP"
            ? `Nhập mã xác thực 6 số đã được gửi tới ${identifier}.`
            : "Nhập email hoặc số điện thoại đã đăng ký để nhận mã khôi phục."}
        </DialogDescription>
      </DialogHeader>

      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 rounded-app-md border border-error-border bg-error-bg p-3 text-caption text-error">
            {errorMessage}
          </div>
        )}

        {step === "IDENTIFIER" && (
          <form onSubmit={handleSendIdentifier} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-identifier"
                className="text-caption font-bold text-foreground"
              >
                Email hoặc Số điện thoại công tác
              </label>
              <Input
                id="forgot-identifier"
                type="text"
                placeholder="VD: doctor.kiet@mediconnect.vn"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isSendingIdentifier}
                autoFocus
              />
              <p className="text-label text-muted">
                Hệ thống sẽ gửi mã số xác thực để cấp quyền đổi mật khẩu.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSendingIdentifier}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSendingIdentifier}>
                {isSendingIdentifier ? (
                  <>
                    <RotateCw className="size-3.5 animate-spin" />
                    <span>Đang gửi mã...</span>
                  </>
                ) : (
                  <span>Gửi mã xác thực</span>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {devCode && (
              <div className="rounded-app-md border border-brand-secondary/30 bg-primary-light p-2.5 text-caption text-primary">
                <span>Mã kiểm thử nội bộ: </span>
                <strong className="font-mono font-bold tracking-widest">
                  {devCode}
                </strong>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="forgot-otp"
                className="text-caption font-bold text-foreground"
              >
                Mã OTP (6 chữ số)
              </label>
              <Input
                id="forgot-otp"
                type="text"
                maxLength={6}
                placeholder="000000"
                className="font-mono text-center tracking-widest text-title font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={isVerifying}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-caption">
              <button
                type="button"
                onClick={() => setStep("IDENTIFIER")}
                className="flex items-center gap-1 text-muted hover:text-foreground"
              >
                <ArrowLeft className="size-3" />
                <span>Đổi thông tin nhận</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isResending}
                className="font-medium text-primary hover:underline disabled:text-muted disabled:no-underline"
              >
                {countdown > 0
                  ? `Gửi lại sau ${countdown}s`
                  : isResending
                  ? "Đang gửi lại..."
                  : "Gửi lại mã"}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isVerifying}
              >
                Đóng
              </Button>
              <Button type="submit" disabled={isVerifying || otp.length < 4}>
                {isVerifying ? (
                  <>
                    <RotateCw className="size-3.5 animate-spin" />
                    <span>Đang xác minh...</span>
                  </>
                ) : (
                  <span>Tiếp tục</span>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "NEW_PASSWORD" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-caption font-bold text-foreground"
              >
                Mật khẩu mới
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isResetting}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-new-password"
                className="text-caption font-bold text-foreground"
              >
                Xác nhận mật khẩu mới
              </label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isResetting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isResetting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={
                  isResetting || password.length < 6 || !confirmPassword
                }
              >
                {isResetting ? (
                  <>
                    <RotateCw className="size-3.5 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Lưu mật khẩu mới</span>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "SUCCESS" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-bg text-success">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="space-y-1">
              <p className="text-body font-bold text-foreground">
                Cập nhật mật khẩu thành công!
              </p>
              <p className="text-caption text-muted">
                Bạn có thể đăng nhập ngay bằng mật khẩu vừa thiết lập.
              </p>
            </div>
            <div className="pt-2">
              <Button className="w-full" onClick={onClose}>
                Quay lại đăng nhập
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialIdentifier = "",
}: ForgotPasswordModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && (
          <ForgotPasswordFormContent
            onClose={onClose}
            initialIdentifier={initialIdentifier}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
