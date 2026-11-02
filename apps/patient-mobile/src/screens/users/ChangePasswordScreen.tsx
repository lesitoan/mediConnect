import { useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // FIX
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import { ArrowLeftIcon, type IconProps } from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

function createIcon(render: () => ReactNode) {
  return function Icon({ size = 20, color = '#8A97A8', strokeWidth = 1.8 }: IconProps) {
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

const LockIcon = createIcon(() => (
  <>
    <Rect x="4" y="10.5" width="16" height="11" rx="2.5" />
    <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <Path d="M12 15.5h.01" strokeWidth={2.6} />
  </>
));

const KeyIcon = createIcon(() => (
  <>
    <Circle cx="7.5" cy="12" r="3.5" />
    <Path d="M11 12h10M18 12v3M15 12v2.5" />
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

const CheckIcon = createIcon(() => <Path d="M20 6 9 17l-5-5" />);

const HistoryLockIcon = createIcon(() => (
  <>
    <Path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
    <Path d="M3 3v5h5" />
    <Rect x="9.3" y="11.3" width="5.4" height="4.6" rx="1" />
    <Path d="M10.4 11.3v-1.1a1.6 1.6 0 0 1 3.2 0v1.1" />
  </>
));

function LockBadgeIcon({ size = 20, color = '#8A97A8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3.5"
        y="10"
        width="14"
        height="11"
        rx="2.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M7 10V7.5a3.5 3.5 0 0 1 7 0V10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="18" cy="18" r="4.5" fill={color} />
      <Path
        d="m15.9 18 1.4 1.4 2.4-2.6"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const HEADER_BLUE = '#1B5FB4';
const REQUIRED_RED = '#D92D20';

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: ReactNode;
  headerRight?: ReactNode;
  error?: string;
};

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  headerRight,
  error,
}: PasswordFieldProps) {
  const [isHidden, setIsHidden] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} <Text style={styles.required}>*</Text>
        </Text>
        {headerRight}
      </View>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {icon}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#7E8A9A"
          secureTextEntry={isHidden}
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          allowFontScaling={false}
        />
        <TouchableOpacity hitSlop={10} onPress={() => setIsHidden(!isHidden)}>
          {isHidden ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

type ChangePasswordScreenProps = {
  onPressBack?: () => void;
  onPressForgotPassword?: () => void;
  onSubmit?: (payload: ChangePasswordPayload) => void;
};

type FieldErrors = {
  current: string;
  next: string;
  confirm: string;
};

const NO_ERRORS: FieldErrors = { current: '', next: '', confirm: '' };

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

export default function ChangePasswordScreen({
  onPressBack,
  onPressForgotPassword,
  onSubmit,
}: ChangePasswordScreenProps) {
  const navigation = useNavigation(); // FIX
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);

  const rules = getRules(newPassword, confirmPassword);

  const handleBack = () => { // FIX
    if (onPressBack) { // FIX
      onPressBack(); // FIX
      return; // FIX
    } // FIX
    if (navigation.canGoBack()) navigation.goBack(); // FIX
  }; // FIX

  const handleForgotPassword = () => { // FIX
    if (onPressForgotPassword) { // FIX
      onPressForgotPassword(); // FIX
      return; // FIX
    } // FIX
    Alert.alert('Thông báo', 'Chức năng đang được phát triển'); // FIX
  }; // FIX

  const handleChange =
    (field: keyof FieldErrors, setter: (text: string) => void) => (text: string) => {
      setter(text);
      if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

  const handleSubmit = () => {
    const nextErrors: FieldErrors = { ...NO_ERRORS };
    if (!currentPassword) nextErrors.current = 'Vui lòng nhập mật khẩu hiện tại';
    if (!rules.slice(0, 4).every((rule) => rule.isMet)) {
      nextErrors.next = 'Mật khẩu mới chưa đáp ứng yêu cầu';
    } else if (newPassword === currentPassword) {
      nextErrors.next = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }
    if (!rules[4].isMet) nextErrors.confirm = 'Mật khẩu xác nhận không khớp';

    setErrors(nextErrors);
    if (nextErrors.current || nextErrors.next || nextErrors.confirm) return;

    if (onSubmit) {
      onSubmit({ currentPassword, newPassword });
      return;
    }
    Alert.alert('Đổi mật khẩu', 'Thông tin hợp lệ');
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <ArrowLeftIcon size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thay đổi mật khẩu</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconBox}>
            <HistoryLockIcon size={34} color={COLORS.PRIMARY_LIGHT} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Đổi mật khẩu tài khoản</Text>
          <Text style={styles.subtitle}>
            Vui lòng nhập mật khẩu hiện tại và tạo mật khẩu mới để bảo vệ tài khoản của bạn.
          </Text>

          <View style={styles.card}>
            <PasswordField
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại..."
              value={currentPassword}
              onChangeText={handleChange('current', setCurrentPassword)}
              icon={<LockIcon size={20} />}
              error={errors.current}
              headerRight={
                <TouchableOpacity hitSlop={8} onPress={handleForgotPassword}>
                  <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              }
            />
            <PasswordField
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới..."
              value={newPassword}
              onChangeText={handleChange('next', setNewPassword)}
              icon={<KeyIcon size={20} />}
              error={errors.next}
            />
            <PasswordField
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới..."
              value={confirmPassword}
              onChangeText={handleChange('confirm', setConfirmPassword)}
              icon={<LockBadgeIcon size={20} />}
              error={errors.confirm}
            />
          </View>

          <View style={styles.requirementCard}>
            <Text style={styles.requirementTitle}>Yêu cầu mật khẩu</Text>
            {rules.map((rule) => (
              <View key={rule.key} style={styles.requirementRow}>
                <View style={[styles.requirementCircle, rule.isMet && styles.requirementCircleMet]}>
                  <CheckIcon
                    size={12}
                    color={rule.isMet ? COLORS.SURFACE : '#9AA7B6'}
                    strokeWidth={2.6}
                  />
                </View>
                <Text style={[styles.requirementText, rule.isMet && styles.requirementTextMet]}>
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSubmit}>
            <Text style={styles.submitText}>Cập nhật mật khẩu</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 17, lineHeight: 24, color: HEADER_BLUE },

  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },
  iconBox: {
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    backgroundColor: '#EAF3FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
    fontSize: 19,
    lineHeight: 26,
    color: COLORS.PRIMARY_LIGHT,
  },
  subtitle: {
    marginTop: 8,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 12.5,
    lineHeight: 19,
    color: '#6E7C8E',
  },

  card: {
    marginTop: 22,
    padding: 22,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  fieldGroup: { marginBottom: 22 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: FONTS.BOLD, fontSize: 12, color: '#1E293B' },
  required: { color: REQUIRED_RED },
  forgotLink: { fontFamily: FONTS.BOLD, fontSize: 12, color: '#2B72A6' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50,
    marginTop: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE4EF',
    backgroundColor: '#F4F7FC',
  },
  inputWrapperFocused: { borderColor: COLORS.PRIMARY_LIGHT, backgroundColor: COLORS.SURFACE },
  inputWrapperError: { borderColor: COLORS.DANGER },
  textInput: {
    flex: 1,
    height: 50,
    fontFamily: FONTS.REGULAR,
    fontSize: 13.5,
    color: '#17202C',
  },
  errorText: { marginTop: 6, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.DANGER },

  requirementCard: {
    marginTop: 16,
    padding: 22,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  requirementTitle: { marginBottom: 14, fontFamily: FONTS.BOLD, fontSize: 13, color: '#1E293B' },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 11 },
  requirementCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8EFF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementCircleMet: { backgroundColor: COLORS.PRIMARY_LIGHT },
  requirementText: { fontFamily: FONTS.REGULAR, fontSize: 12.5, color: '#6B7787' },
  requirementTextMet: { color: '#1E293B' },

  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  submitButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.SURFACE },
});