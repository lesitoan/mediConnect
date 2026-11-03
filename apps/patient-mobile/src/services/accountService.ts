import { requestApi } from './apiClient';

export type AccountGender = 'MALE' | 'FEMALE' | 'OTHER';

export type PersonalInfoPayload = {
  fullName: string;
  dateOfBirth: string | null;
  gender: AccountGender | null;
  address: string;
};

type UpdatedPatientProfile = {
  patientProfile?: {
    id: string;
  };
};

const MIN_PASSWORD_LENGTH = 8;

export async function verifyPassword(password: string): Promise<boolean> {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export async function updatePersonalInfo(
  payload: PersonalInfoPayload,
): Promise<void> {
  const response = await requestApi<UpdatedPatientProfile>(
    '/me',
    {
      method: 'PATCH',
      body: JSON.stringify({
        fullName: payload.fullName,
        dateOfBirth: payload.dateOfBirth,
        gender: payload.gender,
        address: payload.address.trim() || null,
      }),
    },
    true,
  );
  if (!response.patientProfile) {
    throw new Error('API không trả về hồ sơ bệnh nhân sau khi cập nhật.');
  }
}
