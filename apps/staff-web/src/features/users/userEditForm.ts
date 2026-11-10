import type {
  PatientProfileFields,
  UpdateUserInput,
  User,
  UserRole,
} from "./types/userTypes";
import { normalizeUserPhone } from "./utils";

export const PATIENT_TEXT_FIELDS = [
  { name: "nationalId", label: "Số căn cước", type: "text", maxLength: 12 },
  {
    name: "dateOfBirth",
    label: "Ngày sinh",
    type: "date",
    maxLength: undefined,
  },
  { name: "address", label: "Địa chỉ", type: "text", maxLength: 1000 },
  {
    name: "emergencyContactName",
    label: "Người liên hệ khẩn cấp",
    type: "text",
    maxLength: 100,
  },
  {
    name: "emergencyContactPhone",
    label: "Số điện thoại liên hệ khẩn cấp",
    type: "tel",
    maxLength: 20,
  },
] as const;
export const PATIENT_GENDER_LABELS = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};
export type UserEditValues = {
  fullName: string;
  phone: string;
  role: UserRole | null;
  specialtyId: string;
} & {
  [K in keyof PatientProfileFields]: NonNullable<PatientProfileFields[K]> | "";
};

export function userEditValues(user: User): UserEditValues {
  return {
    fullName: user.name,
    phone: user.phone,
    role: user.role,
    specialtyId: user.specialtyId ?? "",
    nationalId: user.patientProfile?.nationalId ?? "",
    dateOfBirth: user.patientProfile?.dateOfBirth ?? "",
    gender: user.patientProfile?.gender ?? "",
    address: user.patientProfile?.address ?? "",
    emergencyContactName: user.patientProfile?.emergencyContactName ?? "",
    emergencyContactPhone: user.patientProfile?.emergencyContactPhone ?? "",
  };
}

export function buildUserUpdate(
  user: User,
  values: UserEditValues,
  canAssignRole: boolean,
  canEditDoctor: boolean,
): UpdateUserInput {
  const changes: UpdateUserInput = { id: user.id };
  if (values.fullName.trim() !== user.name)
    changes.fullName = values.fullName.trim();
  const phone = normalizeUserPhone(values.phone.trim());
  if (user.role !== "PATIENT" && phone !== user.phone) changes.phone = phone;
  if (
    canAssignRole &&
    !user.isCurrentUser &&
    user.role === "RECEPTIONIST" &&
    values.role === "ADMIN"
  )
    changes.role = values.role;
  if (
    canEditDoctor &&
    user.role === "DOCTOR" &&
    values.specialtyId &&
    values.specialtyId !== user.specialtyId
  )
    changes.specialtyId = values.specialtyId;
  if (user.role === "PATIENT" && user.patientProfile) {
    for (const { name } of PATIENT_TEXT_FIELDS) {
      const text = values[name].trim();
      const value =
        (name === "emergencyContactPhone" ? normalizeUserPhone(text) : text) ||
        null;
      if (value !== user.patientProfile[name]) changes[name] = value;
    }
    const gender = values.gender || null;
    if (gender !== user.patientProfile.gender) changes.gender = gender;
  }
  return changes;
}
