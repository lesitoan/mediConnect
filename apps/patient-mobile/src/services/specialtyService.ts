import {
  getPublicApiItems,
  getPublicApiPage,
  type PublicApiPage,
} from './apiClient';

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

export type SpecialtyService = {
  id: string;
  name: string;
  minFee: number | null;
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

function mapSpecialty(specialty: PublicSpecialty): Specialty {
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
}

export async function getSpecialtyPage(
  options: { search?: string; page: number; limit: number },
  signal?: AbortSignal,
): Promise<PublicApiPage<Specialty>> {
  const query = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
  });
  if (options.search?.trim()) query.set('search', options.search.trim());
  const response = await getPublicApiPage<PublicSpecialty>(
    `/specialties?${query}`,
    signal,
  );
  return { ...response, items: response.items.map(mapSpecialty) };
}

export async function getSpecialtyCatalog(
  search?: string,
  signal?: AbortSignal,
): Promise<SpecialtyCatalog> {
  const query = new URLSearchParams();
  if (search?.trim()) query.set('search', search.trim());
  const queryString = query.toString();
  const path = queryString ? `/specialties?${queryString}` : '/specialties';
  const specialties = await getPublicApiItems<PublicSpecialty>(
    path,
    signal,
  );
  const items = specialties.map(mapSpecialty);

  return { totalCount: items.length, items };
}

export function getSpecialtyService(specialty: Specialty): SpecialtyService {
  return {
    id: specialty.id,
    name: specialty.name,
    minFee: specialty.consultationFee,
  };
}
