import { useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { ROOT_ROUTES } from './routes';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <>
            <Stack.Screen name={ROOT_ROUTES.MAIN} component={MainTabNavigator} />
            
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
              {({ navigation }) => (
                <BookingProfileScreen
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onPressAddProfile={() => navigation.navigate(ROOT_ROUTES.CREATE_PROFILE)}
                  onSelectProfile={(profile) =>
                    navigation.navigate(ROOT_ROUTES.SELECT_SPECIALTY, { profile })
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
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onPressChangeProfile={() => navigation.goBack()}
                  onContinue={({ specialty, service }) =>
                    navigation.navigate(ROOT_ROUTES.SELECT_DOCTOR, {
                      profile: route.params.profile,
                      specialty,
                      service,
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
                  service={route.params.service}
                  onPressBack={() => navigation.goBack()}
                  onPressHome={() => navigation.popToTop()}
                  onContinue={({ day, doctor }) =>
                    navigation.navigate(ROOT_ROUTES.SELECT_TIME_SLOT, {
                      profile: route.params.profile,
                      specialty: route.params.specialty,
                      service: route.params.service,
                      doctor,
                      day,
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
                  onPressBook={() => navigation.navigate(ROOT_ROUTES.BOOKING_PROFILE)}
                  onPressAskAI={() => navigation.navigate(ROOT_ROUTES.AI_CHAT)}
                />
              )}
            </Stack.Screen>

          </>
        ) : (
          <Stack.Screen name={ROOT_ROUTES.AUTH}>
            {() => <AuthNavigator onSignIn={() => setIsSignedIn(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}