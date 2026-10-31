import { getPublicApiItems } from "@/lib/api/publicApi";

export type PublicSpecialty = {
  id: string;
  code: string;
  name: string;
  roomCode: string;
  description: string | null;
};

export function getPublicSpecialties(signal?: AbortSignal) {
  return getPublicApiItems<PublicSpecialty>("/specialties", signal);
}
