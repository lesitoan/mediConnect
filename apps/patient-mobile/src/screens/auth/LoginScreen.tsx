import { useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const COLORS = {
  BACKGROUND: '#F6F9FF',
  BACKGROUND_TOP: '#E2EEFB',
  SURFACE: '#FFFFFF',
  PRIMARY: '#005B8D',
  PRIMARY_LIGHT: '#2D74A8',
  PRIMARY_TINT: '#EBF5FF',
  BUTTON_GRADIENT_START: '#3A80B2',
  BUTTON_GRADIENT_END: '#005B8D',
  LOGO_GRADIENT_START: '#F4F9FF',
  LOGO_GRADIENT_END: '#BFD9F0',
  BORDER: '#DFE9F5',
  TEXT: '#131D25',
  TEXT_MUTED: '#41474F',
  ICON_MUTED: '#717880',
  PLACEHOLDER: '#C0C7D0',
  ON_PRIMARY: '#ECF4FF',
  DANGER: '#BA1A1A',
} as const;

const FONTS = {
  REGULAR: 'PlusJakartaSans_400Regular',
  SEMI_BOLD: 'PlusJakartaSans_600SemiBold',
  BOLD: 'PlusJakartaSans_700Bold',
} as const;

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function createIcon(render: () => ReactNode) {
  return function Icon({ size = 20, color = '#005B8D', strokeWidth = 2 }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {render()}
      </Svg>
    );
  };
}

const ArrowLeftIcon = createIcon(() => <Path d="M19 12H5M12 19l-7-7 7-7" />);

const HelpIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
  </>
));

const ContactCardIcon = createIcon(() => (
  <>
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Circle cx="9" cy="11" r="2" />
    <Path d="M5.5 16c.6-1.5 2-2 3.5-2s2.9.5 3.5 2M15 10h4M15 14h3" />
  </>
));

const LockIcon = createIcon(() => (
  <>
    <Rect x="3" y="11" width="18" height="11" rx="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
));

const EyeIcon = createIcon(() => (
  <>
    <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <Circle cx="12" cy="12" r="3" />
  </>
));

const EyeOffIcon = createIcon(() => (
  <Path d="M9.9 9.9a3 3 0 1 0 4.2 4.2M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20" />
));

const UserPlusIcon = createIcon(() => (
  <>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M19 8v6M22 11h-6" />
  </>
));

const HeartPulseIcon = createIcon(() => (
  <>
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
    <Path d="M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3" />
  </>
));

type Language = 'VIE' | 'EN';

type LoginScreenProps = {
  onPressBack?: () => void;
  onPressHelp?: () => void;
  onPressRegister?: () => void;
  onPressForgotPassword?: () => void;
  onLoginSuccess?: (phone: string) => void; // FIX
};

const LANGUAGES: Language[] = ['VIE', 'EN'];
const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

export default function LoginScreen({
  onPressBack,
  onPressHelp,
  onPressRegister,
  onPressForgotPassword,
  onLoginSuccess, // FIX
}: LoginScreenProps) {
  const [language, setLanguage] = useState<Language>('VIE');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [shouldRememberMe, setShouldRememberMe] = useState(true);
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isFocusedPhone, setIsFocusedPhone] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    const nextPhoneError = PHONE_PATTERN.test(phone) ? '' : 'Số điện thoại không hợp lệ';
    const nextPasswordError = password.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự';
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    return !nextPhoneError && !nextPasswordError;
  };

  const handleLogin = () => {
    if (!validate()) return;
    if (onLoginSuccess) { // FIX
      onLoginSuccess(phone); // FIX
      return; // FIX
    } // FIX
    Alert.alert('Đăng nhập', `Số điện thoại: ${phone}`);
  };

  return (
    <LinearGradient
      colors={[COLORS.BACKGROUND_TOP, COLORS.BACKGROUND]}
      locations={[0, 0.45]}
      style={styles.flex}
    >
      <ScreenContainer>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.circleButton} onPress={onPressBack}>
                <ArrowLeftIcon size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>

              <View style={styles.languageSwitch}>
                {LANGUAGES.map((item) => {
                  const isActive = language === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.languageOption, isActive && styles.languageOptionActive]}
                      onPress={() => setLanguage(item)}
                    >
                      <Text style={[styles.languageText, isActive && styles.languageTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.circleButton} onPress={onPressHelp}>
                <HelpIcon size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.brand}>
              <LinearGradient
                colors={[COLORS.LOGO_GRADIENT_START, COLORS.LOGO_GRADIENT_END]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}
              >
                <HeartPulseIcon size={64} color={COLORS.PRIMARY} strokeWidth={1.8} />
              </LinearGradient>
              <Text style={styles.brandTitle}>MediConnect</Text>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>Đăng nhập tài khoản</Text>
              <Text style={styles.subtitle}>Chào mừng bạn quay lại</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isFocusedPhone && styles.inputWrapperFocused,
                    !!phoneError && styles.inputWrapperError,
                  ]}
                >
                  <ContactCardIcon size={18} color={COLORS.PRIMARY} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập số điện thoại..."
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setIsFocusedPhone(true)}
                    onBlur={() => setIsFocusedPhone(false)}
                  />
                </View>
                {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isFocusedPassword && styles.inputWrapperFocused,
                    !!passwordError && styles.inputWrapperError,
                  ]}
                >
                  <LockIcon size={18} color={COLORS.PRIMARY} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập mật khẩu của bạn"
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    secureTextEntry={isPasswordHidden}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsFocusedPassword(true)}
                    onBlur={() => setIsFocusedPassword(false)}
                  />
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => setIsPasswordHidden(!isPasswordHidden)}
                  >
                    {isPasswordHidden ? (
                      <EyeIcon size={18} color={COLORS.ICON_MUTED} />
                    ) : (
                      <EyeOffIcon size={18} color={COLORS.ICON_MUTED} />
                    )}
                  </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setShouldRememberMe(!shouldRememberMe)}
                >
                  <View style={[styles.checkbox, shouldRememberMe && styles.checkboxActive]}>
                    {shouldRememberMe && <View style={styles.checkMark} />}
                  </View>
                  <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onPressForgotPassword}>
                  <Text style={styles.linkText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={handleLogin}>
                <LinearGradient
                  colors={[COLORS.BUTTON_GRADIENT_START, COLORS.BUTTON_GRADIENT_END]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Đăng nhập</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={onPressRegister}>
              <UserPlusIcon size={18} color={COLORS.PRIMARY} />
              <Text style={styles.secondaryButtonText}>Hoặc đăng ký tài khoản mới</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageSwitch: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: COLORS.PRIMARY_TINT,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  languageOption: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  languageOptionActive: { backgroundColor: COLORS.PRIMARY_LIGHT },
  languageText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED },
  languageTextActive: { color: COLORS.ON_PRIMARY },
  brand: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  brandTitle: {
    fontFamily: FONTS.BOLD,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.PRIMARY,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  heading: { alignItems: 'center', paddingBottom: 20 },
  title: {
    fontFamily: FONTS.BOLD,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.TEXT,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.TEXT_MUTED,
    alignSelf: 'stretch',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 20,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inputWrapperFocused: { borderColor: COLORS.PRIMARY },
  inputWrapperError: { borderColor: COLORS.DANGER },
  textInput: { flex: 1, height: 44, fontFamily: FONTS.REGULAR, fontSize: 14, color: COLORS.TEXT },
  errorText: { fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.DANGER, marginTop: 4 },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY_LIGHT,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: COLORS.PRIMARY_LIGHT },
  checkMark: {
    width: 5,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.SURFACE,
    transform: [{ rotate: '45deg' }, { translateY: -1 }],
  },
  rememberText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED },
  linkText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.PRIMARY },
  primaryButton: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.SURFACE },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 91, 141, 0.2)',
    backgroundColor: COLORS.SURFACE,
  },
  secondaryButtonText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: COLORS.PRIMARY },
});