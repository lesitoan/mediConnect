import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react'; // FIX
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import Svg, { Path } from 'react-native-svg';

const COLORS = {
  BACKGROUND: '#F6F9FF',
  BACKGROUND_TOP: '#E2EEFB',
  SURFACE: '#FFFFFF',
  PRIMARY: '#005B8D',
  PRIMARY_LIGHT: '#2D74A8',
  PRIMARY_TINT: '#EBF5FF',
  LOGO_GRADIENT_START: '#E2EEFB',
  LOGO_GRADIENT_END: '#BFD9F0',
  BORDER: '#DFE9F5',
  TEXT: '#131D25',
  TEXT_MUTED: '#41474F',
  ICON_MUTED: '#717880',
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

const MessageDotsIcon = createIcon(() => (
  <>
    <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
    <Path d="M8 12h.01M12 12h.01M16 12h.01" />
  </>
));

const HeartPulseIcon = createIcon(() => (
  <>
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
    <Path d="M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3" />
  </>
));

type OtpScreenProps = {
  phone?: string;
  onPressBack?: () => void;
  onVerified?: (code: string) => void;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const formatTime = (totalSeconds: number) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function OtpScreen({ phone, onPressBack, onVerified }: OtpScreenProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null); // FIX
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleChange = (text: string) => {
    setCode(text.replace(/\D/g, '').slice(0, OTP_LENGTH));
    if (error) setError('');
  };

  const handleVerify = () => {
    if (code.length < OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    if (onVerified) {
      onVerified(code);
      return;
    }
    Alert.alert('Xác nhận mã', `Số điện thoại: ${phone ?? ''}\nMã OTP: ${code}`);
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setCode('');
    setError('');
    setSecondsLeft(RESEND_SECONDS);
    inputRef.current?.focus();
  };

  const activeIndex = Math.min(code.length, OTP_LENGTH - 1);

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

            <View style={styles.card}>
              <View style={styles.iconBadge}>
                <MessageDotsIcon size={26} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.8} />
              </View>

              <Text style={styles.title}>Nhập mã OTP</Text>
              <Text style={styles.description}>
                Mã 6 chữ số đã được gửi tới tin nhắn trên điện thoại của bạn. Vui lòng nhập vào ô
                bên dưới.
              </Text>

              <Pressable style={styles.otpRow} onPress={() => inputRef.current?.focus()}>
                {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                  const digit = code[index] ?? '';
                  const isActive = isFocused && index === activeIndex;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpBox,
                        isActive && styles.otpBoxActive,
                        !!error && styles.otpBoxError,
                      ]}
                    >
                      <Text style={styles.otpDigit}>{digit}</Text>
                    </View>
                  );
                })}
                <TextInput
                  ref={inputRef}
                  style={styles.hiddenInput}
                  value={code}
                  onChangeText={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={OTP_LENGTH}
                  autoFocus
                  caretHidden
                />
              </Pressable>
              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={handleVerify}
              >
                <Text style={styles.primaryButtonText}>Xác nhận mã</Text>
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Chưa nhận được? </Text>
                <TouchableOpacity onPress={handleResend} disabled={secondsLeft > 0} hitSlop={8}>
                  <Text style={styles.resendLink}>
                    {secondsLeft > 0 ? `Gửi lại (${formatTime(secondsLeft)})` : 'Gửi lại'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY_TINT,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.BOLD,
    fontSize: 20,
    lineHeight: 28,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.ICON_MUTED,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: '#1F6FEB',
  },
  otpBoxError: { borderColor: COLORS.DANGER },
  otpDigit: { fontFamily: FONTS.BOLD, fontSize: 20, color: COLORS.TEXT },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    alignSelf: 'flex-start',
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    color: COLORS.DANGER,
    marginTop: 8,
  },
  primaryButton: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryButtonText: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.SURFACE },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendLabel: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },
  resendLink: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 13,
    color: COLORS.TEXT,
    textDecorationLine: 'underline',
  },
});