import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  authenticatePatient,
  registerPatient,
  requestPasswordReset,
  resendOtp,
  resetPatientPassword,
  verifyOtp,
} from '../services/authService';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import { AUTH_ROUTES } from './routes';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  onSignIn: () => void;
};

export default function AuthNavigator({ onSignIn }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={AUTH_ROUTES.LOGIN}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={AUTH_ROUTES.LOGIN}>
        {({ navigation }) => (
          <LoginScreen
            onPressBack={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            onPressRegister={() => navigation.navigate(AUTH_ROUTES.REGISTER)}
            onPressForgotPassword={() =>
              navigation.navigate(AUTH_ROUTES.FORGOT_PASSWORD)
            }
            onLogin={async (phone, password) => {
              await authenticatePatient(phone, password);
              onSignIn();
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
              const challenge = await registerPatient(input);
              navigation.navigate(AUTH_ROUTES.OTP, {
                contact: input.phone,
                purpose: 'REGISTER',
                challenge,
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.FORGOT_PASSWORD}>
        {({ navigation }) => (
          <ForgotPasswordScreen
            onPressBack={() => navigation.goBack()}
            onRequestOtp={requestPasswordReset}
            onOtpRequested={(contact, challenge) => {
              navigation.navigate(AUTH_ROUTES.OTP, {
                contact,
                purpose: 'RESET_PASSWORD',
                challenge,
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.OTP}>
        {({ navigation, route }) => (
          <OtpScreen
            challenge={route.params.challenge}
            purpose={route.params.purpose}
            onPressBack={() => navigation.goBack()}
            onVerify={verifyOtp}
            onResend={() =>
              resendOtp(route.params.contact, route.params.purpose)
            }
            onVerified={({ resetToken }) => {
              if (route.params.purpose === 'REGISTER') {
                Alert.alert(
                  'Tài khoản đã xác thực',
                  'Bạn có thể đăng nhập bằng số điện thoại và mật khẩu vừa đăng ký.',
                  [
                    {
                      text: 'Đăng nhập',
                      onPress: () =>
                        navigation.reset({
                          index: 0,
                          routes: [{ name: AUTH_ROUTES.LOGIN }],
                        }),
                    },
                  ],
                );
                return;
              }
              if (!resetToken) return;
              navigation.navigate(AUTH_ROUTES.SET_PASSWORD, {
                contact: route.params.contact,
                resetToken,
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.SET_PASSWORD}>
        {({ navigation, route }) => (
          <SetPasswordScreen
            phone={route.params.contact}
            onPressBack={() => navigation.goBack()}
            onSubmit={async (password) => {
              await resetPatientPassword(route.params.resetToken, password);
              Alert.alert(
                'Đặt lại mật khẩu thành công',
                'Đăng nhập bằng mật khẩu mới của bạn.',
                [
                  {
                    text: 'Đăng nhập',
                    onPress: () =>
                      navigation.reset({
                        index: 0,
                        routes: [{ name: AUTH_ROUTES.LOGIN }],
                      }),
                  },
                ],
              );
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
