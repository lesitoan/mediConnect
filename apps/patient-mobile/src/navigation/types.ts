import type { NavigatorScreenParams } from '@react-navigation/native';
import { AUTH_ROUTES, MAIN_TABS, ROOT_ROUTES } from './routes';
import type { Profile } from '../services/profileService';
import type { Specialty, SpecialtyService } from '../services/specialtyService';
import type { Doctor, ScheduleDay, TimeSlot } from '../services/scheduleService';
export type AuthStackParamList = {
  [AUTH_ROUTES.LOGIN]: undefined;
  [AUTH_ROUTES.REGISTER]: undefined;
  [AUTH_ROUTES.OTP]: { phone: string };
  [AUTH_ROUTES.SET_PASSWORD]: { phone: string };
};

export type MainTabParamList = {
  [MAIN_TABS.HOME]: undefined;
  [MAIN_TABS.NOTIFICATIONS]: undefined;
  [MAIN_TABS.FUNCTIONS]: undefined;
  [MAIN_TABS.PROFILE]: undefined;
};

export type RootStackParamList = {
  [ROOT_ROUTES.AUTH]: NavigatorScreenParams<AuthStackParamList>;
  [ROOT_ROUTES.MAIN]: NavigatorScreenParams<MainTabParamList>;
  [ROOT_ROUTES.BOOKING_PROFILE]: undefined;
  [ROOT_ROUTES.CREATE_PROFILE]: undefined;
  [ROOT_ROUTES.SELECT_SPECIALTY]: { profile: Profile };
  [ROOT_ROUTES.SELECT_DOCTOR]: {
    profile: Profile;
    specialty: Specialty;
    service: SpecialtyService;
  };
  [ROOT_ROUTES.SELECT_TIME_SLOT]: {
    profile: Profile;
    specialty: Specialty;
    service: SpecialtyService;
    doctor: Doctor;
    day: ScheduleDay;
  };
  [ROOT_ROUTES.CONFIRM_BOOKING]: {
    profile: Profile;
    specialty: Specialty;
    service: SpecialtyService;
    doctor: Doctor;
    day: ScheduleDay;
    slot: TimeSlot;
  };
  [ROOT_ROUTES.APPOINTMENT_HISTORY]: undefined;
  [ROOT_ROUTES.RESCHEDULE]: { appointmentId: string };
  [ROOT_ROUTES.CANCEL_APPOINTMENT]: { appointmentId: string; appointmentCode: string };
  [ROOT_ROUTES.AI_CHAT]: undefined;
  [ROOT_ROUTES.AI_RESCHEDULE]: undefined;
  [ROOT_ROUTES.AI_CANCEL]: undefined;
  [ROOT_ROUTES.HEALTH_RECORD]: undefined;
  [ROOT_ROUTES.RATING]: undefined;
  [ROOT_ROUTES.PAYMENT]: undefined;
  [ROOT_ROUTES.INVOICE_LIST]: undefined;
  [ROOT_ROUTES.INVOICE_DETAIL]: { invoiceId: string };
  [ROOT_ROUTES.SEARCH]: undefined;
};