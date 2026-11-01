import { getPublicApiItems } from "@/lib/api/publicApi";

export type PublicDoctor = {
  id: string;
  doctorCode: string;
  academicTitle: string | null;
  qualification: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  specialty: {
    id: string;
    code: string;
    name: string;
    roomCode: string;
  };
  user: {
    fullName: string;
  };
};

export function getPublicDoctors(signal?: AbortSignal) {
  return getPublicApiItems<PublicDoctor>("/providers", signal);
}
