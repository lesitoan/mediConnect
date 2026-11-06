import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
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
            onLoginSuccess={onSignIn}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.REGISTER}>
        {({ navigation }) => (
          <RegisterScreen
            onPressBack={() => navigation.goBack()}
            onPressLogin={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.replace(AUTH_ROUTES.LOGIN);
            }}
            onSubmitPhone={(phone) => navigation.navigate(AUTH_ROUTES.OTP, { phone })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.OTP}>
        {({ navigation, route }) => (
          <OtpScreen
            phone={route.params.phone}
            onPressBack={() => navigation.goBack()}
            onVerified={() =>
              navigation.navigate(AUTH_ROUTES.SET_PASSWORD, { phone: route.params.phone })
            }
          />
        )}
      </Stack.Screen>

      <Stack.Screen name={AUTH_ROUTES.SET_PASSWORD}>
        {({ navigation, route }) => (
          <SetPasswordScreen
            phone={route.params.phone}
            onPressBack={() => navigation.goBack()}
            onSubmit={() =>
              Alert.alert('Thành công', 'Mật khẩu đã được thiết lập. Vui lòng đăng nhập.', [
                {
                  text: 'Đăng nhập',
                  onPress: () =>
                    navigation.reset({ index: 0, routes: [{ name: AUTH_ROUTES.LOGIN }] }),
                },
              ])
            }
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}