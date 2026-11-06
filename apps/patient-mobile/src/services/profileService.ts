import { requestApi } from './apiClient';

export type Profile = {
  id: string;
  fullName: string;
  code: string;
  phone: string;
  isSelf: boolean;
  birthDate?: string;
  gender?: string;
  email?: string;
  address?: string;
};

export type PatientProfile = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
};

export async function getPatientProfile(): Promise<PatientProfile> {
  return requestApi<PatientProfile>('/me/patient-profile', {}, true);
}

function formatBirthDate(dateOfBirth: string | null): string | undefined {
  if (!dateOfBirth) return undefined;
  const [year, month, day] = dateOfBirth.slice(0, 10).split('-');
  if (!year || !month || !day) return undefined;
  return `${day}/${month}/${year}`;
}

export async function getProfiles(): Promise<Profile[]> {
  const profile = await getPatientProfile();
  return [
    {
      id: profile.id,
      fullName: profile.fullName,
      code: profile.patientCode,
      phone: profile.phone ?? '',
      isSelf: true,
      birthDate: formatBirthDate(profile.dateOfBirth),
      gender: profile.gender ?? undefined,
      email: profile.email ?? undefined,
      address: profile.address ?? undefined,
    },
  ];
}
