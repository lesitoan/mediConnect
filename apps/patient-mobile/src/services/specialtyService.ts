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

export type SpecialtyService = {
  id: string;
  name: string;
  description: string;
  iconKey: SpecialtyIconKey;
  minFee: number | null;
  isAvailable: boolean;
};

export type Specialty = {
  id: string;
  code: string;
  name: string;
  doctorCount?: number;
  iconKey: SpecialtyIconKey;
  services: SpecialtyService[];
};

export type SpecialtyCatalog = {
  totalCount: number;
  popular: Specialty[];
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
    const iconKey = getSpecialtyIcon(specialty.name);
    const service: SpecialtyService = {
      id: specialty.id,
      name: `Khám ${specialty.name}`,
      description: specialty.description ?? `Khám và tư vấn chuyên khoa ${specialty.name}.`,
      iconKey,
      minFee:
        specialty.consultationFee === null
          ? null
          : Number(specialty.consultationFee),
      isAvailable: true,
    };
    return {
      id: specialty.id,
      code: specialty.code,
      name: specialty.name,
      iconKey,
      services: [service],
    };
  });

  return { totalCount: items.length, popular: items };
}
