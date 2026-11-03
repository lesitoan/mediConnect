import {
  ApiRequestError,
  clearPatientSession,
  getPatientSession,
  requestApi,
  savePatientSession,
} from './apiClient';

type OtpChallenge = {
  challengeId: string;
  channel: 'EMAIL' | 'ZALO';
  expiresIn: number;
  retryAfter: number;
  developmentCode?: string;
};

type PatientUser = {
  name: string;
  role: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type RegistrationInput = {
  name: string;
  phone: string;
  password: string;
};

export async function registerPatient(
  input: RegistrationInput,
): Promise<OtpChallenge> {
  return requestApi<OtpChallenge>('/authentication/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function requestPasswordReset(
  contact: string,
): Promise<OtpChallenge> {
  const normalized = contact.trim();
  return requestApi<OtpChallenge>('/authentication/forgot_password', {
    method: 'POST',
    body: JSON.stringify(
      normalized.includes('@')
        ? { email: normalized.toLowerCase() }
        : { phone: normalized },
    ),
  });
}

export async function resendOtp(
  contact: string,
  purpose: 'REGISTER' | 'RESET_PASSWORD',
): Promise<OtpChallenge> {
  const normalized = contact.trim();
  return requestApi<OtpChallenge>('/authentication/send_otp', {
    method: 'POST',
    body: JSON.stringify({
      ...(normalized.includes('@')
        ? { email: normalized.toLowerCase() }
        : { phone: normalized }),
      purpose,
    }),
  });
}

export async function verifyOtp(
  challengeId: string,
  otp: string,
): Promise<{ purpose: 'REGISTER' | 'RESET_PASSWORD'; resetToken?: string }> {
  return requestApi('/authentication/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, otp }),
  });
}

export async function resetPatientPassword(
  resetToken: string,
  password: string,
): Promise<void> {
  await requestApi('/authentication/reset_password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, password }),
  });
}

export async function authenticatePatient(
  phone: string,
  password: string,
): Promise<PatientUser> {
  const result = await requestApi<LoginResponse>('/authentication/login', {
    method: 'POST',
    body: JSON.stringify({
      phone: phone.trim(),
      password,
      clientType: 'MOBILE',
    }),
  });
  if (!result.accessToken || !result.refreshToken) {
    throw new Error('API không trả về token đăng nhập cho ứng dụng mobile.');
  }

  await savePatientSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  try {
    const user = await requestApi<PatientUser>('/me', {}, true);
    if (user.role !== 'PATIENT') {
      await requestApi('/authentication/logout', { method: 'POST' }, true);
      throw new Error('Tài khoản này không có quyền truy cập ứng dụng bệnh nhân.');
    }
    return user;
  } catch (error) {
    await clearPatientSession();
    throw error;
  }
}

export async function restorePatientSession(): Promise<boolean> {
  const session = await getPatientSession();
  if (!session) return false;
  try {
    const user = await requestApi<PatientUser>('/me', {}, true);
    if (user.role !== 'PATIENT') {
      await clearPatientSession();
      return false;
    }
    return true;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      await clearPatientSession();
      return false;
    }
    throw error;
  }
}

export async function logoutPatient(): Promise<void> {
  try {
    await requestApi('/authentication/logout', { method: 'POST' }, true);
  } finally {
    await clearPatientSession();
  }
}
