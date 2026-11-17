import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
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
  BUTTON_GRADIENT_START: '#6DB3E8',
  BUTTON_GRADIENT_END: '#2D74A8',
  BORDER: '#DFE9F5',
  TEXT: '#131D25',
  TEXT_MUTED: '#41474F',
  ICON_MUTED: '#717880',
  PLACEHOLDER: '#C0C7D0',
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

const SmartphoneIcon = createIcon(() => (
  <>
    <Rect x="5" y="2" width="14" height="20" rx="3" />
    <Path d="M12 18h.01" />
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

type RegisterScreenProps = {
  onPressBack?: () => void;
  onPressLogin?: () => void;
  onPressTerms?: () => void;
  onSubmit?: (input: { name: string; phone: string; password: string }) => Promise<void>;
};

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

export default function RegisterScreen({
  onPressBack,
  onPressLogin,
  onPressTerms,
  onSubmit,
}: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isFocusedPhone, setIsFocusedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');

  const validate = () => {
    const nextNameError = name.trim().length >= 2 ? '' : 'Vui lòng nhập họ và tên';
    const nextPhoneError = PHONE_PATTERN.test(phone) ? '' : 'Số điện thoại không hợp lệ';
    const nextPasswordError =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/.test(password)
        ? ''
        : 'Mật khẩu cần 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
    const nextConfirmPasswordError =
      confirmPassword === password ? '' : 'Mật khẩu xác nhận không khớp';
    const nextTermsError = hasAcceptedTerms ? '' : 'Bạn cần đồng ý với điều khoản sử dụng';
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setTermsError(nextTermsError);
    return (
      !nextNameError &&
      !nextPhoneError &&
      !nextPasswordError &&
      !nextConfirmPasswordError &&
      !nextTermsError
    );
  };

  const handleRegister = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    setRequestError('');
    try {
      await onSubmit?.({ name: name.trim(), phone: phone.trim(), password });
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'Không thể đăng ký tài khoản.',
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <TouchableOpacity style={styles.backRow} onPress={onPressBack} hitSlop={10}>
              <ArrowLeftIcon size={20} color={COLORS.PRIMARY} />
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>

            <View style={styles.heading}>
              <Text style={styles.title}>Đăng ký tài khoản</Text>
              <Text style={styles.subtitle}>Tạo tài khoản bệnh nhân và xác thực bằng OTP</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={[styles.inputWrapper, !!nameError && styles.inputWrapperError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    value={name}
                    onChangeText={(value) => {
                      setName(value);
                      setNameError('');
                    }}
                    autoCapitalize="words"
                    maxLength={100}
                  />
                </View>
                {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isFocusedPhone && styles.inputWrapperFocused,
                    !!phoneError && styles.inputWrapperError,
                  ]}
                >
                  <SmartphoneIcon size={20} color={COLORS.PRIMARY} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập số điện thoại..."
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(value) => {
                      setPhone(value);
                      setPhoneError('');
                    }}
                    onFocus={() => setIsFocusedPhone(true)}
                    onBlur={() => setIsFocusedPhone(false)}
                  />
                </View>
                {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={[styles.inputWrapper, !!passwordError && styles.inputWrapperError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tạo mật khẩu an toàn"
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setPasswordError('');
                    }}
                    secureTextEntry={isPasswordHidden}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => setIsPasswordHidden(!isPasswordHidden)}
                  >
                    {isPasswordHidden ? (
                      <EyeIcon size={20} color={COLORS.ICON_MUTED} />
                    ) : (
                      <EyeOffIcon size={20} color={COLORS.ICON_MUTED} />
                    )}
                  </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nhập lại mật khẩu</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    !!confirmPasswordError && styles.inputWrapperError,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      setConfirmPasswordError('');
                    }}
                    secureTextEntry={isConfirmPasswordHidden}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}
                  >
                    {isConfirmPasswordHidden ? (
                      <EyeIcon size={20} color={COLORS.ICON_MUTED} />
                    ) : (
                      <EyeOffIcon size={20} color={COLORS.ICON_MUTED} />
                    )}
                  </TouchableOpacity>
                </View>
                {!!confirmPasswordError && (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                )}
              </View>

              <View style={styles.termsGroup}>
                <TouchableOpacity
                  style={styles.termsRow}
                  activeOpacity={0.8}
                  onPress={() => setHasAcceptedTerms(!hasAcceptedTerms)}
                >
                  <View style={[styles.checkbox, hasAcceptedTerms && styles.checkboxActive]}>
                    {hasAcceptedTerms && <View style={styles.checkMark} />}
                  </View>
                  <Text style={styles.termsText}>
                    Tôi đã đọc, đồng ý với các{' '}
                    <Text style={styles.termsLink} onPress={onPressTerms}>
                      điều khoản sử dụng
                    </Text>{' '}
                    và cho phép Bệnh viện sử dụng thông tin, dữ liệu phục vụ khám chữa bệnh.
                  </Text>
                </TouchableOpacity>
                {!!termsError && <Text style={styles.errorText}>{termsError}</Text>}
              </View>

              {!!requestError && <Text style={styles.errorText}>{requestError}</Text>}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={[COLORS.BUTTON_GRADIENT_START, COLORS.BUTTON_GRADIENT_END]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={COLORS.SURFACE} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Đăng ký tài khoản</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={onPressLogin}
            >
              <Text style={styles.secondaryButtonText}>Đăng nhập</Text>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 15, color: COLORS.PRIMARY },
  heading: { alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
  title: {
    fontFamily: FONTS.BOLD,
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.TEXT,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.REGULAR,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_MUTED,
    alignSelf: 'stretch',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT, marginBottom: 10 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inputWrapperFocused: { borderColor: COLORS.PRIMARY },
  inputWrapperError: { borderColor: COLORS.DANGER },
  textInput: { flex: 1, height: 54, fontFamily: FONTS.REGULAR, fontSize: 15, color: COLORS.TEXT },
  errorText: { fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.DANGER, marginTop: 6 },
  termsGroup: { marginBottom: 24 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 2,
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
  termsText: {
    flex: 1,
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.TEXT_MUTED,
  },
  termsLink: {
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY,
    textDecorationLine: 'underline',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.SURFACE },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.BORDER },
  dividerText: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.ICON_MUTED },
  secondaryButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY_LIGHT,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.PRIMARY },
});