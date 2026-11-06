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
  BUTTON_GRADIENT_START: '#6DB3E8',
  BUTTON_GRADIENT_END: '#2D74A8',
  LOGO_GRADIENT_START: '#E2EEFB',
  LOGO_GRADIENT_END: '#BFD9F0',
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
  EXTRA_BOLD: 'PlusJakartaSans_800ExtraBold',
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

const HeartPulseIcon = createIcon(() => (
  <>
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
    <Path d="M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3" />
  </>
));

type RegisterScreenProps = {
  onPressBack?: () => void;
  onPressLogin?: () => void;
  onPressTerms?: () => void;
  onSubmitPhone?: (phone: string) => void; // FIX
};

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

export default function RegisterScreen({
  onPressBack,
  onPressLogin,
  onPressTerms,
  onSubmitPhone, // FIX
}: RegisterScreenProps) {
  const [phone, setPhone] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isFocusedPhone, setIsFocusedPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [termsError, setTermsError] = useState('');

  const validate = () => {
    const nextPhoneError = PHONE_PATTERN.test(phone) ? '' : 'Số điện thoại không hợp lệ';
    const nextTermsError = hasAcceptedTerms ? '' : 'Bạn cần đồng ý với điều khoản sử dụng';
    setPhoneError(nextPhoneError);
    setTermsError(nextTermsError);
    return !nextPhoneError && !nextTermsError;
  };

  const handleRegister = () => {
    if (!validate()) return;
    if (onSubmitPhone) { // FIX
      onSubmitPhone(phone); // FIX
      return; // FIX
    } // FIX
    Alert.alert('Đăng ký tài khoản', `Số điện thoại: ${phone}`);
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

            <View style={styles.brand}>
              <LinearGradient
                colors={[COLORS.LOGO_GRADIENT_START, COLORS.LOGO_GRADIENT_END]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}
              >
                <HeartPulseIcon size={30} color={COLORS.PRIMARY} strokeWidth={1.8} />
              </LinearGradient>
              <View>
                <Text style={styles.brandWelcome}>Chào mừng đến với</Text>
                <Text style={styles.brandTitle}>MEDICONNECT</Text>
              </View>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>Đăng ký tài khoản</Text>
              <Text style={styles.subtitle}>Đăng ký bằng số điện thoại của bạn</Text>
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
                  <SmartphoneIcon size={20} color={COLORS.PRIMARY} />
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

              <TouchableOpacity activeOpacity={0.85} onPress={handleRegister}>
                <LinearGradient
                  colors={[COLORS.BUTTON_GRADIENT_START, COLORS.BUTTON_GRADIENT_END]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Đăng ký tài khoản</Text>
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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 20,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWelcome: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, lineHeight: 16, color: COLORS.TEXT },
  brandTitle: {
    fontFamily: FONTS.EXTRA_BOLD,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: COLORS.PRIMARY,
  },
  heading: { alignItems: 'center', paddingBottom: 20 },
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