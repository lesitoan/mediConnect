export interface SpecialtyRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  roomCode: string;
  consultationFee: string | null;
  isActive: boolean;
}
export interface CreateSpecialtyInput {
  code: string;
  name: string;
  roomCode: string;
  description: string | null;
  consultationFee: string;
}
