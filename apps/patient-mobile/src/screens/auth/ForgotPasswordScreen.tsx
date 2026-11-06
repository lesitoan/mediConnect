import { useState } from 'react';
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
import { COLORS, FONTS } from '../../constants/theme';

type OtpChallenge = {
  challengeId: string;
  channel: 'EMAIL' | 'ZALO' | 'SMS';
  expiresIn: number;
  retryAfter: number;
  developmentCode?: string;
};

type ForgotPasswordScreenProps = {
  onPressBack?: () => void;
  onRequestOtp: (contact: string) => Promise<OtpChallenge>;
  onOtpRequested: (contact: string, challenge: OtpChallenge) => void;
};

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

export default function ForgotPasswordScreen({
  onPressBack,
  onRequestOtp,
  onOtpRequested,
}: ForgotPasswordScreenProps) {
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [developmentChallenge, setDevelopmentChallenge] =
    useState<OtpChallenge | null>(null);

  const handleSubmit = async () => {
    const value = contact.trim();
    const isEmail = value.includes('@');
    if (!value || (!isEmail && !PHONE_PATTERN.test(value))) {
      setError('Nhập email hoặc số điện thoại đã đăng ký.');
      return;
    }
    if (isSubmitting) return;

    if (developmentChallenge) {
      onOtpRequested(value, developmentChallenge);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const challenge = await onRequestOtp(value);
      if (challenge.developmentCode) {
        setDevelopmentChallenge(challenge);
      } else {
        onOtpRequested(value, challenge);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Không thể yêu cầu mã OTP.',
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
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity onPress={onPressBack} style={styles.backButton}>
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
            <View style={styles.card}>
              <Text style={styles.title}>Khôi phục mật khẩu</Text>
              <Text style={styles.description}>
                Nhập email hoặc số điện thoại đã đăng ký. Nếu tài khoản hợp lệ,
                mã OTP sẽ được gửi để xác minh.
              </Text>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={contact}
                onChangeText={(value) => {
                  setContact(value);
                  setError('');
                  setDevelopmentChallenge(null);
                }}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={COLORS.PLACEHOLDER}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              {!!developmentChallenge?.developmentCode && (
                <View style={styles.developmentCodeContainer}>
                  <Text style={styles.developmentCodeLabel}>
                    Mã OTP (Dev Mode)
                  </Text>
                  <Text selectable style={styles.developmentCode}>
                    {developmentChallenge.developmentCode}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.submitButton}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.SURFACE} />
                ) : (
                  <Text style={styles.submitText}>
                    {developmentChallenge ? 'Nhập mã OTP' : 'Gửi mã OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 10 },
  backText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: COLORS.PRIMARY },
  card: {
    marginTop: 28,
    padding: 22,
    borderRadius: 24,
    backgroundColor: COLORS.SURFACE,
  },
  title: { fontFamily: FONTS.BOLD, fontSize: 22, color: COLORS.TEXT },
  description: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.TEXT_MUTED,
  },
  label: {
    marginBottom: 8,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 13,
    color: COLORS.TEXT,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    fontFamily: FONTS.REGULAR,
    fontSize: 14,
    color: COLORS.TEXT,
  },
  error: {
    marginTop: 8,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    color: COLORS.DANGER,
  },
  developmentCodeContainer: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND_TOP,
    alignItems: 'center',
  },
  developmentCodeLabel: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  developmentCode: {
    marginTop: 4,
    fontFamily: FONTS.BOLD,
    fontSize: 22,
    letterSpacing: 4,
    color: COLORS.PRIMARY,
  },
  submitButton: {
    height: 50,
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.SURFACE },
});
