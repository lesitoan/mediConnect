import type {
  PatientAppointment,
  ReceptionStats,
  ReceptionFilterTab,
  WalkInReceptionInput,
  PatientProfile,
} from "../types/receptionTypes";

export function computeReceptionStats(
  appointments: PatientAppointment[]
): ReceptionStats {
  const waitingCheckIn = appointments.filter(
    (a) => a.status === "WAITING_CHECKIN"
  ).length;
  const upcoming = appointments.filter((a) => a.status === "UPCOMING").length;
  const late = appointments.filter((a) => a.status === "LATE").length;
  const checkedIn = appointments.filter((a) => a.status === "CHECKED_IN").length;

  return {
    total: appointments.length,
    waitingCheckIn,
    upcoming,
    late,
    checkedIn,
  };
}

export function filterAppointments(
  appointments: PatientAppointment[],
  tab: ReceptionFilterTab,
  searchQuery: string,
  specialtyFilter: string
): PatientAppointment[] {
  let result = appointments;

  // Filter by tab
  if (tab === "WAITING_CHECKIN") {
    result = result.filter((a) => a.status === "WAITING_CHECKIN");
  } else if (tab === "UPCOMING") {
    result = result.filter((a) => a.status === "UPCOMING");
  } else if (tab === "LATE") {
    result = result.filter((a) => a.status === "LATE");
  } else if (tab === "CHECKED_IN") {
    result = result.filter((a) => a.status === "CHECKED_IN");
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.patientCode.toLowerCase().includes(q) ||
        a.appointmentCode.toLowerCase().includes(q) ||
        a.patientPhone.includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.room.toLowerCase().includes(q)
    );
  }

  // Filter by specialty
  if (specialtyFilter && specialtyFilter !== "ALL") {
    result = result.filter((a) => a.specialtyName === specialtyFilter);
  }

  return result;
}

export function searchPatientProfiles(
  query: string,
  profiles: PatientProfile[]
): PatientProfile[] {
  if (!query.trim()) {
    return profiles;
  }
  const q = query.toLowerCase().trim().replace(/[\s.-]/g, "");
  return profiles.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(query.toLowerCase().trim());
    const codeMatch = p.patientCode.toLowerCase().includes(query.toLowerCase().trim());
    const phoneClean = p.phone.replace(/[\s.-]/g, "");
    const phoneMatch = phoneClean.includes(q);
    const idMatch = p.nationalId ? p.nationalId.includes(q) : false;
    const addressMatch = p.address.toLowerCase().includes(query.toLowerCase().trim());
    return nameMatch || codeMatch || phoneMatch || idMatch || addressMatch;
  });
}

export function checkInExistingAppointment(
  appointment: PatientAppointment
): PatientAppointment {
  const currentCheckedCount = Math.floor(Math.random() * 20) + 15;
  const prefix = appointment.specialtyName.includes("Nhi") ? "A" : "B";
  const queueNumber = `${prefix}-${String(currentCheckedCount).padStart(3, "0")}`;

  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return {
    ...appointment,
    status: "CHECKED_IN",
    paymentStatus: "PAID",
    queueNumber,
    checkInTime: timeString,
  };
}

export function createWalkInAppointment(
  input: WalkInReceptionInput,
  currentCount: number
): PatientAppointment {
  const nextNum = currentCount + 1;
  const appointmentCode = `AP-${2060 + nextNum}`;
  const patientCode = input.patientCode || `BN-${1450 + nextNum}`;
  const prefix = input.specialtyName.includes("Nhi") ? "A" : "B";
  const queueNumber = `${prefix}-${String(nextNum + 10).padStart(3, "0")}`;

  const time = input.timeSlot.split(" - ")[0] || "08:30";

  return {
    id: `apt-walkin-${Date.now()}`,
    appointmentCode,
    patientCode,
    patientName: input.patientName,
    patientPhone: input.patientPhone,
    patientGender: input.patientGender,
    patientBirthYear: input.patientBirthYear,
    time,
    doctorName: input.doctorName,
    doctorDegree: "BS.CKII",
    room: input.room,
    specialtyName: input.specialtyName,
    status: "CHECKED_IN",
    paymentStatus: "PAID",
    queueNumber,
    checkInTime: time,
    reason: input.reason || input.servicePackage,
  };
}
