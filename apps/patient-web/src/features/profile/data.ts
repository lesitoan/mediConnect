export type PatientGender = "MALE" | "FEMALE" | "OTHER";

export type IdentityForm = {
  dateOfBirth: string;
  gender: PatientGender | "";
  address: string;
};

export function ageOf(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

export function dobVN(dateOfBirth: string | null) {
  if (!dateOfBirth) return "Chưa cập nhật";
  const [year, month, day] = dateOfBirth.split("-");
  return `${day}/${month}/${year}`;
}

export function formatProfileDate(value: string | null) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
