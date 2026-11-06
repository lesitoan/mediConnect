import {
  getPublicApiPage,
  requestApi,
  type PublicApiPage,
} from './apiClient';

export type StrengthIconKey =
  | 'CORONARY'
  | 'HYPERTENSION'
  | 'HEART_FAILURE'
  | 'DOPPLER'
  | 'INTERVENTION';

export type DoctorStrength = {
  id: string;
  label: string;
  iconKey: StrengthIconKey;
};

export type DoctorProfile = {
  id: string;
  fullName: string;
  academicTitle: string | null;
  position: string | null;
  hospitalName: string | null;
  rating: number | null;
  reviewCount: number;
  experienceYears: number | null;
  treatedCases: number | null;
  introduction: string | null;
  strengths: DoctorStrength[] | null;
  clinicName: string | null;
  clinicAddress: string | null;
  photoUrl?: string | null;
  specialtyId: string;
  specialtyName: string;
  roomCode: string | null;
};

export type SearchDoctor = {
  id: string;
  name: string;
  specialtyId: string;
  degree: string | null;
  isProfessor: boolean;
  experienceYears: number | null;
  position: string | null;
  rating: number | null;
  reviews: number;
  availability: 'unknown';
  avatarUri?: string | null;
};

type PublicDoctor = {
  id: string;
  academicTitle: 'PROFESSOR' | 'ASSOCIATE_PROFESSOR' | null;
  qualification: string | null;
  bio: string | null;
  avatarUrl: string | null;
  experienceYears: number | null;
  treatedCases: number | null;
  position: string | null;
  hospitalName: string | null;
  clinicAddress: string | null;
  strengths: DoctorStrength[] | null;
  rating: number | null;
  reviewCount: number;
  user: { fullName: string };
  specialty: { id: string; name: string; roomCode: string };
};

const ACADEMIC_TITLE_LABELS = {
  PROFESSOR: 'Giáo sư',
  ASSOCIATE_PROFESSOR: 'Phó Giáo sư',
} as const;

function getAcademicTitle(
  academicTitle: PublicDoctor['academicTitle'],
  qualification: string | null,
): string | null {
  const title = academicTitle ? ACADEMIC_TITLE_LABELS[academicTitle] : null;
  return [title, qualification].filter(Boolean).join(', ') || null;
}

function mapDoctorProfile(doctor: PublicDoctor): DoctorProfile {
  return {
    id: doctor.id,
    fullName: doctor.user.fullName,
    academicTitle: getAcademicTitle(doctor.academicTitle, doctor.qualification),
    position: doctor.position,
    hospitalName: doctor.hospitalName,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    experienceYears: doctor.experienceYears,
    treatedCases: doctor.treatedCases,
    introduction: doctor.bio,
    strengths: doctor.strengths,
    clinicName: doctor.specialty.roomCode
      ? `Phòng ${doctor.specialty.roomCode}`
      : null,
    clinicAddress: doctor.clinicAddress,
    photoUrl: doctor.avatarUrl,
    specialtyId: doctor.specialty.id,
    specialtyName: doctor.specialty.name,
    roomCode: doctor.specialty.roomCode,
  };
}

function mapSearchDoctor(doctor: PublicDoctor): SearchDoctor {
  const profile = mapDoctorProfile(doctor);
  return {
    id: profile.id,
    name: profile.fullName,
    specialtyId: profile.specialtyId,
    degree: profile.academicTitle,
    isProfessor: doctor.academicTitle !== null,
    experienceYears: profile.experienceYears,
    position: profile.position,
    rating: profile.rating,
    reviews: profile.reviewCount,
    availability: 'unknown',
    avatarUri: profile.photoUrl,
  };
}

export async function getDoctorPage(
  options: {
    search?: string;
    specialtyId?: string;
    hasAcademicTitle?: boolean;
    availabilityDate?: string;
    sortBy: 'RATING' | 'EXPERIENCE';
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
): Promise<PublicApiPage<SearchDoctor>> {
  const query = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
  });
  if (options.search?.trim()) query.set('search', options.search.trim());
  if (options.specialtyId) query.set('specialtyId', options.specialtyId);
  if (options.hasAcademicTitle) query.set('hasAcademicTitle', 'true');
  if (options.availabilityDate) {
    query.set('availabilityDate', options.availabilityDate);
  }
  query.set('sortBy', options.sortBy);
  const response = await getPublicApiPage<PublicDoctor>(
    `/providers?${query}`,
    signal,
  );
  return { ...response, items: response.items.map(mapSearchDoctor) };
}

export async function getDoctorProfile(
  doctorId: string,
  signal?: AbortSignal,
): Promise<DoctorProfile> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(doctorId)) {
    throw new Error('Mã bác sĩ không hợp lệ.');
  }
  const doctor = await requestApi<PublicDoctor>(
    `/providers/${encodeURIComponent(doctorId)}`,
    { signal },
  );
  return mapDoctorProfile(doctor);
}
