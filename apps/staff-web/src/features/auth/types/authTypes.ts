export interface LoginInput {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface ApiLoginPayload {
  email?: string;
  phone?: string;
  password: string;
  clientType: "WEB";
}

export interface LoginResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  sessionId: string;
  refreshExpiresIn: number;
  refreshToken?: string;
}

export interface ForgotPasswordInput {
  identifier: string;
}

export interface OtpChallengeData {
  challengeId: string;
  channel: "EMAIL" | "ZALO";
  expiresIn: number;
  retryAfter: number;
  developmentCode?: string;
}

export interface VerifyOtpInput {
  challengeId: string;
  otp: string;
}

export interface VerifyOtpResponseData {
  purpose: "REGISTER" | "RESET_PASSWORD";
  resetToken?: string;
  expiresIn?: number;
  activated?: boolean;
}

export interface ResetPasswordInput {
  resetToken: string;
  password: string;
}

export type UserRole =
  | "ADMIN"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "PATIENT";

export interface CurrentUser {
  id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  roleId?: string;
  role: string;
  status?: string;
  permissions: string[];
}

