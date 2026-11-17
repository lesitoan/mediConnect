import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import { AUTH_ROUTES } from './routes';
import type { AuthStackParamList } from './types';
import { 
  authenticatePatient, 
  registerPatient, 
  forgotPassword, 
  verifyRegistrationOtp, 
  verifyResetOtp, 
  resetPassword 
} from '../services/authService';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  onSignIn: () => void;
};

export default function AuthNavigator({ onSignIn }: AuthNavigatorProps) {
  return (
    <Stack.Navigator initialRouteName={AUTH_ROUTES.LOGIN} screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name={AUTH_ROUTES.LOGIN}>
        {({ navigation }) => (
          <LoginScreen
            onPressRegister={() => navigation.navigate(AUTH_ROUTES.REGISTER)}
            onPressForgotPassword={() => navigation.navigate(AUTH_ROUTES.FORGOT_PASSWORD)}
            onLogin={async (phone, password) => {
              await authenticatePatient(phone, password);
              onSignIn();
            }}
            onVerifyPhone={async (phone) => {
              console.log('Verify phone requested', phone);
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.REGISTER}>
        {({ navigation }) => (
          <RegisterScreen
            onPressBack={() => navigation.goBack()}
            onPressLogin={() => navigation.navigate(AUTH_ROUTES.LOGIN)}
            onSubmit={async (input) => {
              const res = await registerPatient(input);
              navigation.navigate(AUTH_ROUTES.OTP, {
                phone: input.phone,
                purpose: 'REGISTER',
                challengeId: res.challengeId,
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.FORGOT_PASSWORD}>
        {({ navigation }) => (
          <ForgotPasswordScreen
            onPressBack={() => navigation.goBack()}
            onSubmit={async (contact) => {
              const res = await forgotPassword(contact);
              navigation.navigate(AUTH_ROUTES.OTP, {
                phone: contact,
                purpose: 'RESET_PASSWORD',
                challengeId: res.challengeId,
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.OTP}>
        {({ navigation, route }) => (
          <OtpScreen
            phone={route.params.phone}
            challengeId={route.params.challengeId}
            onPressBack={() => navigation.goBack()}
            onVerified={async (otpCode) => {
              if (route.params.purpose === 'REGISTER') {
                await verifyRegistrationOtp(route.params.challengeId, otpCode);
                Alert.alert(
                  'Tài khoản đã xác thực',
                  'Bạn có thể đăng nhập bằng số điện thoại và mật khẩu vừa đăng ký.',
                  [{ text: 'Đăng nhập', onPress: () => navigation.reset({ index: 0, routes: [{ name: AUTH_ROUTES.LOGIN }] }) }]
                );
                return;
              }
              const resetToken = await verifyResetOtp(route.params.challengeId, otpCode);
              navigation.navigate(AUTH_ROUTES.SET_PASSWORD, { phone: route.params.phone, resetToken });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.SET_PASSWORD}>
        {({ navigation, route }) => (
          <SetPasswordScreen
            phone={route.params.phone}
            onPressBack={() => navigation.goBack()}
            onSubmit={async (newPassword) => {
              await resetPassword(route.params.resetToken, newPassword);
              Alert.alert('Thành công', 'Mật khẩu đã được thiết lập. Vui lòng đăng nhập.', [
                { text: 'Đăng nhập', onPress: () => navigation.reset({ index: 0, routes: [{ name: AUTH_ROUTES.LOGIN }] }) },
              ]);
            }}
          />
        )}
      </Stack.Screen>
      
    </Stack.Navigator>
  );
}