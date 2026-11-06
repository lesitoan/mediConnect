export const AUTH_ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  OTP: 'Otp',
  SET_PASSWORD: 'SetPassword',
  FORGOT_PASSWORD: 'ForgotPassword',
} as const;

export const MAIN_TABS = {
  HOME: 'Home',
  NOTIFICATIONS: 'Notifications',
  FUNCTIONS: 'Functions',
  PROFILE: 'Profile',
  HEALTH_RECORD: 'HealthRecord',
} as const;

export const ROOT_ROUTES = {
  AUTH: 'Auth',
  MAIN: 'Main',
  BOOKING_PROFILE: 'BookingProfile',
  CREATE_PROFILE: 'CreateProfile',
  SELECT_SPECIALTY: 'SelectSpecialty',
  SELECT_DOCTOR: 'SelectDoctor',
  SELECT_TIME_SLOT: 'SelectTimeSlot',
  CONFIRM_BOOKING: 'ConfirmBooking',
  APPOINTMENT_HISTORY: 'AppointmentHistory',
  RESCHEDULE: 'Reschedule',
  CANCEL_APPOINTMENT: 'CancelAppointment',
  AI_CHAT: 'AIChat',
  AI_RESCHEDULE: 'AIReschedule',
  AI_CANCEL: 'AICancel',
  HEALTH_RECORD: 'HealthRecord',
  RATING: 'Rating',
  PAYMENT: 'Payment',
  INVOICE_LIST: 'InvoiceList',
  INVOICE_DETAIL: 'InvoiceDetail',
  SEARCH: 'Search',
  DOCTOR_DETAIL: 'DoctorDetail',
  PERSONAL_INFO: 'PersonalInfo',
  CHANGE_PASSWORD: 'ChangePassword',
} as const;