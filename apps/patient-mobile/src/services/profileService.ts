export type Profile = {
  id: string;
  fullName: string;
  code: string;
  phone: string;
  isSelf: boolean;
};

const MOCK_PROFILES: Profile[] = [
  {
    id: '1',
    fullName: 'Trần Thị Quỳnh',
    code: 'W26-0502537',
    phone: '0339999380',
    isSelf: true,
  },
];

export async function getProfiles(): Promise<Profile[]> {
  return MOCK_PROFILES;
}