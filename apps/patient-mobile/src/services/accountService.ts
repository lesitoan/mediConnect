export type AccountGender = 'MALE' | 'FEMALE';

export type PersonalInfoPayload = {
  lastName: string;
  firstName: string;
  birthDate: string;
  gender: AccountGender;
  email: string;
};

const MIN_PASSWORD_LENGTH = 6;

export async function verifyPassword(password: string): Promise<boolean> {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export async function updatePersonalInfo(_payload: PersonalInfoPayload): Promise<void> {
  return undefined;
}

