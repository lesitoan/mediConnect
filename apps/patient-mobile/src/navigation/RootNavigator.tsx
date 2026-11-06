import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookingProfileScreen from '../screens/appointments/BookingProfileScreen';
import CreateProfileScreen from '../screens/appointments/CreateProfileScreen';
import SelectSpecialtyScreen from '../screens/appointments/SelectSpecialtyScreen';
import SelectDoctorScreen from '../screens/appointments/SelectDoctorScreen';
import SelectTimeSlotScreen from '../screens/appointments/SelectTimeSlotScreen';
import ConfirmBookingScreen from '../screens/appointments/ConfirmBookingScreen'; 
import AppointmentHistoryScreen from '../screens/appointments/AppointmentHistoryScreen';
import RescheduleScreen from '../screens/appointments/RescheduleScreen';
import CancelAppointmentScreen from '../screens/appointments/CancelAppointmentScreen';
import AIChatScreen from '../screens/ai/AIChatScreen';
import AIRescheduleScreen from '../screens/ai/AIRescheduleScreen';
import AICancelScreen from '../screens/ai/AICancelScreen';
import HealthRecordScreen from '../screens/records/HealthRecordScreen';
import RatingScreen from '../screens/reviews/RatingScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';
import InvoiceListScreen from '../screens/invoices/InvoiceListScreen';
import DoctorSearchScreen from '../screens/search/DoctorSearchScreen';
import DoctorDetailScreen from '../screens/search/DoctorDetailScreen';
import PersonalInfoScreen from '../screens/users/PersonalInfoScreen';
import ChangePasswordScreen from '../screens/users/ChangePasswordScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { ROOT_ROUTES } from './routes';
import type { RootStackParamList } from './types';
import { logoutPatient, restorePatientSession } from '../services/authService';
import { getSpecialtyService } from '../services/specialtyService';
import { COLORS } from '../constants/theme';


const Stack = createNativeStackNavigator<RootStackParamList>();
type BookingIntent = NonNullable<RootStackParamList[typeof ROOT_ROUTES.BOOKING_PROFILE]>;

export default function RootNavigator() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [pendingBooking, setPendingBooking] = useState<BookingIntent | null>(null);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    if (!isSignedIn || !pendingBooking || !navigationRef.isReady()) return;
    navigationRef.navigate(ROOT_ROUTES.BOOKING_PROFILE, pendingBooking);
    setPendingBooking(null);
  }, [isSignedIn, navigationRef, pendingBooking]);

  useEffect(() => {
    let isActive = true;
    restorePatientSession()
      .then((isAuthenticated) => {
        if (isActive) setIsSignedIn(isAuthenticated);
      })
      .catch((error: unknown) => {
        if (isActive) {
          Alert.alert(
            'Không thể khôi phục phiên',
            error instanceof Error ? error.message : 'Vui lòng đăng nhập lại.',
          );
          setIsSignedIn(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutPatient();
    } catch (error: unknown) {
      Alert.alert(
        'Không thể kết thúc phiên trên máy chủ',
        error instanceof Error
          ? error.message
          : 'Phiên trên thiết bị đã bị xóa. Hãy thử lại khi có kết nối.',
      );
    } finally {
      setPendingBooking(null);
      setIsSignedIn(false);
    }
  };

  if (isSignedIn === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isSignedIn ? ROOT_ROUTES.MAIN : ROOT_ROUTES.SEARCH}
        screenOptions={{ headerShown: false }}
      >
        {isSignedIn ? (
          <>
            <Stack.Screen name={ROOT_ROUTES.MAIN}>
              {() => <MainTabNavigator onSignOut={handleSignOut} />}
            </Stack.Screen>
            
            <Stack.Screen name={ROOT_ROUTES.AI_CHAT}>
              {({ navigation }) => (
                <AIChatScreen 
                  onPressBack={() => navigation.popToTop()} 
                  onPressStartBooking={() => navigation.navigate(ROOT_ROUTES.BOOKING_PROFILE)} 
                  onPressAction={(id) => {
                    if (id === 'reschedule') navigation.navigate(ROOT_ROUTES.AI_RESCHEDULE);
                    if (id === 'cancel') navigation.navigate(ROOT_ROUTES.AI_CANCEL);
                  }}
                /> 
              )}
            </Stack.Screen> 
            
            <Stack.Screen name={ROOT_ROUTES.AI_RESCHEDULE}>
              {({ navigation }) => (
                <AIRescheduleScreen
                  onPressBack={() => navigation.goBack()}
                  onPressSelectReschedule={(appointmentId) => 
                    navigation.navigate(ROOT_ROUTES.RESCHEDULE, { appointmentId })
                  }
                  onPressConfirmSlot={(appointmentId) => 
                    navigation.navigate(ROOT_ROUTES.RESCHEDULE, { appointmentId })
                  }
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.AI_CANCEL}>
              {({ navigation }) => (
                <AICancelScreen
                  onPressBack={() => navigation.goBack()}
                  onPressSelectCancel={(appointmentId: string, appointmentCode: string) =>
                    navigation.navigate(ROOT_ROUTES.CANCEL_APPOINTMENT, { appointmentId, appointmentCode })
                  }
                  onPressConfirmCancel={(appointmentId: string, appointmentCode: string, reasonId: string | null) =>
                    navigation.navigate(ROOT_ROUTES.CANCEL_APPOINTMENT, { appointmentId, appointmentCode })
                  }
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.BOOKING_PROFILE}>
              {({ navigation, route }) => (
                <BookingProfileScreen
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onPressAddProfile={() => navigation.navigate(ROOT_ROUTES.CREATE_PROFILE)}
                  onSelectProfile={(profile) =>
                    navigation.navigate(ROOT_ROUTES.SELECT_SPECIALTY, {
                      profile,
                      initialSpecialtyId: route.params?.specialtyId,
                      preferredDoctorId: route.params?.doctorId,
                      preferredDateKey: route.params?.dateKey,
                      preferredSlotId: route.params?.slotId,
                    })
                  }
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.HEALTH_RECORD}>
              {({ navigation }) => (
                <HealthRecordScreen onPressBack={() => navigation.goBack()} />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.CREATE_PROFILE}>
              {({ navigation }) => (
                <CreateProfileScreen
                  onPressBack={() => navigation.goBack()}
                  onSubmit={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.RATING}>
              {({ navigation }) => (
                <RatingScreen
                  onPressBack={() => navigation.goBack()}
                  onSubmit={() =>
                    Alert.alert('Cảm ơn bạn', 'Đánh giá của bạn đã được gửi.', [
                      { text: 'Về trang chủ', onPress: () => navigation.goBack() },
                    ])
                  }
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen name={ROOT_ROUTES.PAYMENT}>
              {({ navigation }) => (
                <PaymentScreen
                  onPressBack={() => navigation.goBack()}
                  onPay={({ total }) =>
                    Alert.alert('Thanh toán', `Đang chuyển sang cổng thanh toán ${total.toLocaleString('vi-VN')} đ`, [
                      { text: 'Về trang chủ', onPress: () => navigation.goBack() },
                    ])
                  }
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.SELECT_SPECIALTY}>
              {({ navigation, route }) => (
                <SelectSpecialtyScreen
                  profile={route.params.profile}
                  initialSpecialtyId={route.params.initialSpecialtyId}
                  preferredDoctorId={route.params.preferredDoctorId}
                  preferredDateKey={route.params.preferredDateKey}
                  preferredSlotId={route.params.preferredSlotId}
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onPressChangeProfile={() => navigation.goBack()}
                  onPressAssistant={() => navigation.navigate(ROOT_ROUTES.AI_CHAT)}
                  onContinue={({ specialty }) =>
                    navigation.navigate(ROOT_ROUTES.SELECT_DOCTOR, {
                      profile: route.params.profile,
                      specialty,
                      preferredDoctorId: route.params.preferredDoctorId,
                      preferredDateKey: route.params.preferredDateKey,
                      preferredSlotId: route.params.preferredSlotId,
                    })
                  }
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen name={ROOT_ROUTES.SELECT_DOCTOR}>
              {({ navigation, route }) => (
                <SelectDoctorScreen
                  profile={route.params.profile}
                  specialty={route.params.specialty}
                  preferredDoctorId={route.params.preferredDoctorId}
                  preferredDateKey={route.params.preferredDateKey}
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onContinue={({ day, doctor }) =>
                    navigation.navigate(ROOT_ROUTES.SELECT_TIME_SLOT, {
                      profile: route.params.profile,
                      specialty: route.params.specialty,
                      service: getSpecialtyService(route.params.specialty),
                      doctor,
                      day,
                      preferredSlotId: route.params.preferredSlotId,
                    })
                  }
                />
              )}
            </Stack.Screen>

             <Stack.Screen name={ROOT_ROUTES.SELECT_TIME_SLOT}>
              {({ navigation, route }) => (
                <SelectTimeSlotScreen
                  profile={route.params.profile}
                  specialty={route.params.specialty}
                  service={route.params.service}
                  doctor={route.params.doctor}
                  day={route.params.day}
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onPressChangeDay={() => navigation.goBack()}
                  onContinue={({ slot }) =>
                    navigation.navigate(ROOT_ROUTES.CONFIRM_BOOKING, {
                      profile: route.params.profile,
                      specialty: route.params.specialty,
                      service: route.params.service,
                      doctor: route.params.doctor,
                      day: route.params.day,
                      slot,
                    })
                  }
                />
              )}
            </Stack.Screen>
 
            <Stack.Screen name={ROOT_ROUTES.CONFIRM_BOOKING}>
              {({ navigation, route }) => (
                <ConfirmBookingScreen
                  profile={route.params.profile}
                  specialty={route.params.specialty}
                  service={route.params.service}
                  doctor={route.params.doctor}
                  day={route.params.day}
                  slot={route.params.slot}
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onConfirmed={(appointment) =>
                    Alert.alert('Đặt hẹn thành công', `Mã phiếu hẹn: ${appointment.code}`, [
                      { text: 'Về trang chủ', onPress: () => navigation.popToTop() },
                    ])
                  }
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.APPOINTMENT_HISTORY}>
              {({ navigation }) => (
                <AppointmentHistoryScreen
                  onPressBack={() => navigation.goBack()}
                  onPressNewBooking={() => navigation.navigate(ROOT_ROUTES.BOOKING_PROFILE)}
                  onPressReschedule={(appointment) => 
                    navigation.navigate(ROOT_ROUTES.RESCHEDULE, { appointmentId: appointment.id }) 
                  } 
                  onPressCancel={(appointment) => 
                    navigation.navigate(ROOT_ROUTES.CANCEL_APPOINTMENT, { appointmentId: appointment.id,  appointmentCode: appointment.code })
                  } 
                />  
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.RESCHEDULE}>
              {({ navigation, route }) => (
                <RescheduleScreen
                  appointmentId={route.params.appointmentId}
                  onPressBack={() => navigation.goBack()}
                  onConfirmed={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen name={ROOT_ROUTES.CANCEL_APPOINTMENT}>
              {({ navigation, route }) => (
                <CancelAppointmentScreen
                  appointmentId={route.params.appointmentId}
                  appointmentCode={route.params.appointmentCode}
                  onPressBack={() => navigation.goBack()}
                  onPressReschedule={() => {
                    navigation.replace(ROOT_ROUTES.RESCHEDULE, { appointmentId: route.params.appointmentId });
                  }}
                  onConfirmCancel={() => {
                    Alert.alert('Thành công', 'Đã hủy lịch hẹn.');
                    navigation.goBack(); 
                  }}
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen name={ROOT_ROUTES.INVOICE_LIST}>
              {({ navigation }) => (
                <InvoiceListScreen
                  onPressBack={() => navigation.goBack()}
                  onPressInvoice={(invoice) =>
                    navigation.navigate(ROOT_ROUTES.INVOICE_DETAIL, { invoiceId: invoice.id })
                  }
                />
              )}
            </Stack.Screen>
 
            <Stack.Screen name={ROOT_ROUTES.INVOICE_DETAIL}>
              {({ navigation, route }) => (
                <InvoiceDetailScreen
                  invoiceId={route.params.invoiceId}
                  onPressBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.SEARCH}>
              {({ navigation }) => (
                <DoctorSearchScreen
                  onPressBack={() => navigation.goBack()}
                  onPressHelp={() => navigation.navigate(ROOT_ROUTES.AI_CHAT)}
                  onPressBook={(doctor) =>
                    navigation.navigate(ROOT_ROUTES.BOOKING_PROFILE, {
                      doctorId: doctor.id,
                      specialtyId: doctor.specialtyId,
                    })
                  }
                  onPressAskAI={() => navigation.navigate(ROOT_ROUTES.AI_CHAT)}
                  onPressViewDetail={(doctor) =>
                    navigation.navigate(ROOT_ROUTES.DOCTOR_DETAIL, { doctorId: doctor.id })
                  }
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.DOCTOR_DETAIL}>
              {({ navigation, route }) => (
                <DoctorDetailScreen
                  doctorId={route.params.doctorId}
                  onPressBack={() => navigation.goBack()}
                  onPressBook={(selection) =>
                    navigation.navigate(ROOT_ROUTES.BOOKING_PROFILE, {
                      doctorId: selection.doctorId,
                      specialtyId: selection.specialtyId,
                      dateKey: selection.dateKey,
                      slotId: selection.slotId,
                    })
                  }
                  onPressChat={() => navigation.navigate(ROOT_ROUTES.AI_CHAT)}
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen name={ROOT_ROUTES.PERSONAL_INFO}>
              {({ navigation }) => (
                <PersonalInfoScreen
                  onPressBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name={ROOT_ROUTES.CHANGE_PASSWORD}>
              {({ navigation }) => (
                <ChangePasswordScreen
                  onPressBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>

          </>
        ) : (
          <>
            <Stack.Screen name={ROOT_ROUTES.AUTH}>
              {() => <AuthNavigator onSignIn={() => setIsSignedIn(true)} />}
            </Stack.Screen>
            <Stack.Screen name={ROOT_ROUTES.SEARCH}>
              {({ navigation }) => (
                <DoctorSearchScreen
                  onPressBack={() => navigation.navigate(ROOT_ROUTES.AUTH)}
                  onPressHelp={() => navigation.navigate(ROOT_ROUTES.AUTH)}
                  onPressBook={(doctor) => {
                    setPendingBooking({
                      doctorId: doctor.id,
                      specialtyId: doctor.specialtyId,
                    });
                    navigation.navigate(ROOT_ROUTES.AUTH);
                  }}
                  onPressAskAI={() => navigation.navigate(ROOT_ROUTES.AUTH)}
                  onPressViewDetail={(doctor) =>
                    navigation.navigate(ROOT_ROUTES.DOCTOR_DETAIL, {
                      doctorId: doctor.id,
                    })
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen name={ROOT_ROUTES.DOCTOR_DETAIL}>
              {({ navigation, route }) => (
                <DoctorDetailScreen
                  doctorId={route.params.doctorId}
                  onPressBack={() => navigation.goBack()}
                  onPressBook={(selection) => {
                    setPendingBooking({
                      doctorId: selection.doctorId,
                      specialtyId: selection.specialtyId,
                      dateKey: selection.dateKey,
                      slotId: selection.slotId,
                    });
                    navigation.navigate(ROOT_ROUTES.AUTH);
                  }}
                  onPressChat={() => navigation.navigate(ROOT_ROUTES.AUTH)}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}