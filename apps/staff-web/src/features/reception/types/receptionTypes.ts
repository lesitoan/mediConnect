export type AppointmentStatus =
  | "WAITING_CHECKIN" // Chờ check-in (Người bệnh đã đến, chờ cấp số)
  | "UPCOMING"        // Sắp đến (Người bệnh chưa đến cơ sở y tế)
  | "LATE"            // Trễ hẹn
  | "CHECKED_IN";     // Đã check-in (Đã cấp STT vào phòng khám)

export type PaymentStatus =
  | "PAID"         // Đã thu
  | "UNPAID"       // Chưa thu
  | "FREE_REEXAM"; // Miễn phí tái khám

export type ReceptionFilterTab =
  | "ALL"
  | "WAITING_CHECKIN"
  | "UPCOMING"
  | "LATE"
  | "CHECKED_IN";

export interface ReceptionFilterValues {
  tab: ReceptionFilterTab;
  search: string;
  specialty: string;
  page: number;
  pageSize: number;
}

export interface PatientAppointment {
  id: string;
  appointmentCode: string; // VD: AP-2045
  patientCode: string;     // VD: BN-0881
  patientName: string;
  patientPhone: string;
  patientGender?: "MALE" | "FEMALE";
  patientBirthYear?: number;
  time: string;            // VD: "07:45"
  doctorName: string;
  doctorDegree: string;    // VD: "TS.BS", "PGS.TS.BS"
  room: string;            // VD: "P.305"
  specialtyName: string;   // VD: "Khoa Tim mạch"
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  queueNumber?: string;    // VD: "A-023"
  reason?: string;
  checkInTime?: string;
}

export interface PatientProfile {
  id: string;
  patientCode: string;
  name: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  birthYear: number;
  address: string;
  nationalId?: string;
  insuranceCode?: string;
  lastVisit?: string;
}

export interface WalkInReceptionInput {
  patientCode?: string;
  patientName: string;
  patientPhone: string;
  patientGender: "MALE" | "FEMALE";
  patientBirthYear: number;
  address?: string;
  nationalId?: string;     // CCCD/BHYT
  specialtyName: string;
  doctorName: string;
  room: string;
  servicePackage: string;
  appointmentDate: string;
  timeSlot: string;
  reason: string;
}

export interface ReceptionStats {
  total: number;
  waitingCheckIn: number; // Chờ check-in (Người bệnh đã đến rồi)
  upcoming: number;       // Sắp đến (Người bệnh chưa đến)
  late: number;           // Trễ hẹn
  checkedIn: number;      // Đã check-in
}

