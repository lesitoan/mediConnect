export type DoctorDataTab = "SCHEDULE" | "HISTORY" | "REVIEWS";
export type DoctorTabRecord =
  | {
      id: string;
      startsAt: string;
      endsAt: string;
      status: string;
      scheduleType: string;
    }
  | {
      id: string;
      completedAt: string | null;
      appointmentCode: string;
      patient: { patientCode: string; fullName: string };
      specialtyName: string;
    }
  | {
      id: string;
      doctorRating: number;
      serviceRating: number;
      comment: string | null;
      createdAt: string;
    };
