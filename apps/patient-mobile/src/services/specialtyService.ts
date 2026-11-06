import { getPublicApiItems } from './apiClient';

export type SpecialtyIconKey =
  | 'STETHOSCOPE'
  | 'HEART_PULSE'
  | 'SMILE'
  | 'SKIN'
  | 'SPINE'
  | 'EAR'
  | 'MATERNITY'
  | 'DIGESTIVE';

export type Specialty = {
  id: string;
  code: string;
  name: string;
  roomCode: string;
  description: string | null;
  consultationFee: number | null;
  iconKey: SpecialtyIconKey;
};

export type SpecialtyCatalog = {
  totalCount: number;
  items: Specialty[];
};

type PublicSpecialty = {
  id: string;
  code: string;
  name: string;
  roomCode: string;
  description: string | null;
  consultationFee: string | number | null;
};

function getSpecialtyIcon(value: string): SpecialtyIconKey {
  const normalized = value.toLowerCase();
  if (normalized.includes('tim')) return 'HEART_PULSE';
  if (normalized.includes('nhi')) return 'SMILE';
  if (normalized.includes('da li')) return 'SKIN';
  if (normalized.includes('xương') || normalized.includes('cột sống')) return 'SPINE';
  if (normalized.includes('tai') || normalized.includes('mũi') || normalized.includes('họng')) return 'EAR';
  if (normalized.includes('sản') || normalized.includes('phụ')) return 'MATERNITY';
  if (normalized.includes('tiêu hóa') || normalized.includes('gan')) return 'DIGESTIVE';
  return 'STETHOSCOPE';
}

export async function getSpecialtyCatalog(
  signal?: AbortSignal,
): Promise<SpecialtyCatalog> {
  const specialties = await getPublicApiItems<PublicSpecialty>(
    '/specialties',
    signal,
  );
  const items = specialties.map((specialty) => {
    const consultationFee =
      specialty.consultationFee === null
        ? null
        : Number(specialty.consultationFee);
    if (consultationFee !== null && !Number.isFinite(consultationFee)) {
      throw new Error('API trả về phí khám chuyên khoa không hợp lệ.');
    }
    return {
      id: specialty.id,
      code: specialty.code,
      name: specialty.name,
      roomCode: specialty.roomCode,
      description: specialty.description,
      consultationFee,
      iconKey: getSpecialtyIcon(specialty.name),
    };
  });

  return { totalCount: items.length, items };
}
