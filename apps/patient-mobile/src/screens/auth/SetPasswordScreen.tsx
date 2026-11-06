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
  SURFACE_MUTED: '#EEF3F8',
  PRIMARY: '#005B8D',
  PRIMARY_LIGHT: '#2D74A8',
  LOGO_GRADIENT_START: '#E2EEFB',
  LOGO_GRADIENT_END: '#BFD9F0',
  BORDER: '#DFE9F5',
  RULE_INACTIVE: '#E3EAF2',
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
const ArrowRightIcon = createIcon(() => <Path d="M5 12h14M12 5l7 7-7 7" />);
const CheckIcon = createIcon(() => <Path d="M20 6L9 17l-5-5" />);

const SmartphoneIcon = createIcon(() => (
  <>
    <Rect x="5" y="2" width="14" height="20" rx="3" />
    <Path d="M12 18h.01" />
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

const HeartPulseIcon = createIcon(() => (
  <>
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
    <Path d="M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3" />
  </>
));

type SetPasswordScreenProps = {
  phone?: string;
  onPressBack?: () => void;
  onSubmit?: (password: string) => void;
};

const getRules = (password: string, confirm: string) => [
  { key: 'length', label: 'Mật khẩu từ 8 ký tự trở lên', isMet: password.length >= 8 },
  { key: 'lower', label: 'Chứa ít nhất 1 chữ thường', isMet: /[a-z]/.test(password) },
  { key: 'upper', label: 'Chứa ít nhất 1 chữ hoa', isMet: /[A-Z]/.test(password) },
  { key: 'digit', label: 'Chứa ít nhất 1 chữ số', isMet: /\d/.test(password) },
  {
    key: 'match',
    label: 'Xác nhận mật khẩu trùng khớp',
    isMet: confirm.length > 0 && password === confirm,
  },
];

export default function SetPasswordScreen({ phone, onPressBack, onSubmit }: SetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmHidden, setIsConfirmHidden] = useState(true);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isFocusedConfirm, setIsFocusedConfirm] = useState(false);
  const [error, setError] = useState('');

  const rules = getRules(password, confirm);
  const isValid = rules.every((rule) => rule.isMet);

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (error) setError('');
  };

  const handleChangeConfirm = (text: string) => {
    setConfirm(text);
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!isValid) {
      setError('Mật khẩu chưa đáp ứng đầy đủ các yêu cầu');
      return;
    }
    if (onSubmit) {
      onSubmit(password);
      return;
    }
    Alert.alert('Đặt mật khẩu mới', `Số điện thoại: ${phone ?? ''}`);
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
              <Text style={styles.title}>Đặt mật khẩu mới</Text>
              <Text style={styles.subtitle}>Tạo mật khẩu an toàn cho tài khoản của bạn</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <View style={styles.readOnlyBox}>
                  <SmartphoneIcon size={20} color={COLORS.ICON_MUTED} />
                  <Text style={styles.readOnlyText}>{phone ?? ''}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View
                  style={[styles.inputWrapper, isFocusedPassword && styles.inputWrapperFocused]}
                >
                  <LockIcon size={18} color={COLORS.ICON_MUTED} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập mật khẩu..."
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    secureTextEntry={isPasswordHidden}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={handleChangePassword}
                    onFocus={() => setIsFocusedPassword(true)}
                    onBlur={() => setIsFocusedPassword(false)}
                  />
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => setIsPasswordHidden(!isPasswordHidden)}
                  >
                    {isPasswordHidden ? (
                      <EyeOffIcon size={18} color={COLORS.ICON_MUTED} />
                    ) : (
                      <EyeIcon size={18} color={COLORS.ICON_MUTED} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroupLast}>
                <Text style={styles.label}>Nhập lại mật khẩu</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isFocusedConfirm && styles.inputWrapperFocused,
                    !!error && styles.inputWrapperError,
                  ]}
                >
                  <LockIcon size={18} color={COLORS.ICON_MUTED} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập lại mật khẩu..."
                    placeholderTextColor={COLORS.PLACEHOLDER}
                    secureTextEntry={isConfirmHidden}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={confirm}
                    onChangeText={handleChangeConfirm}
                    onFocus={() => setIsFocusedConfirm(true)}
                    onBlur={() => setIsFocusedConfirm(false)}
                  />
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => setIsConfirmHidden(!isConfirmHidden)}
                  >
                    {isConfirmHidden ? (
                      <EyeOffIcon size={18} color={COLORS.ICON_MUTED} />
                    ) : (
                      <EyeIcon size={18} color={COLORS.ICON_MUTED} />
                    )}
                  </TouchableOpacity>
                </View>
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>
            </View>

            <View style={[styles.card, styles.rulesCard]}>
              <Text style={styles.rulesTitle}>Yêu cầu mật khẩu</Text>
              {rules.map((rule) => (
                <View key={rule.key} style={styles.ruleRow}>
                  <View style={[styles.ruleCircle, rule.isMet && styles.ruleCircleMet]}>
                    <CheckIcon
                      size={11}
                      color={rule.isMet ? COLORS.SURFACE : COLORS.ICON_MUTED}
                      strokeWidth={3}
                    />
                  </View>
                  <Text style={styles.ruleText}>{rule.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.spacer} />

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryButtonText}>Xác nhận</Text>
              <ArrowRightIcon size={18} color={COLORS.SURFACE} />
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
  heading: { alignItems: 'flex-start', paddingBottom: 20 },
  title: {
    fontFamily: FONTS.BOLD,
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.TEXT,
  },
  subtitle: {
    fontFamily: FONTS.REGULAR,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_MUTED,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  rulesCard: { marginTop: 16 },
  inputGroup: { marginBottom: 16 },
  inputGroupLast: {},
  label: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT, marginBottom: 10 },
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: COLORS.SURFACE_MUTED,
    borderRadius: 20,
  },
  readOnlyText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 15, color: COLORS.TEXT },
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
  rulesTitle: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT, marginBottom: 14 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  ruleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.RULE_INACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCircleMet: { backgroundColor: COLORS.PRIMARY_LIGHT },
  ruleText: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },
  spacer: { flex: 1, minHeight: 20 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  primaryButtonText: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.SURFACE },
});