import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ScreenContainer';
import { PhoneIcon, UserIcon } from '../../components/icons';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  LockIcon,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  updatePersonalInfo,
  type AccountGender,
} from '../../services/accountService';
import { getProfiles, type Profile } from '../../services/profileService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type AccountProfile = Profile & {
  birthDate?: string;
  gender?: string;
  email?: string;
};

const SCREEN_PADDING = 16;
const NAVY = '#12395C';
const FIELD_BACKGROUND = '#EEF3F8';
const BACKGROUND_GRADIENT = ['#E3EFFB', COLORS.BACKGROUND] as const;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const BIRTH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const GENDER_OPTIONS: { value: AccountGender; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
];

const maskPhone = (phone: string) =>
  phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : phone;

const splitFullName = (fullName: string) => {
  const words = fullName.trim().split(/\s+/);
  if (words.length < 2) return { lastName: '', firstName: words[0] ?? '' };
  return { lastName: words.slice(0, -1).join(' '), firstName: words[words.length - 1] };
};

const formatBirthDateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
};

const isValidBirthDate = (value: string) => {
  const match = BIRTH_DATE_PATTERN.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate && year >= 1900 && date <= new Date();
};

const parseGender = (value?: string): AccountGender | '' =>
  value === 'MALE' || value === 'FEMALE' ? value : '';

type FieldProps = {
  label: string;
  error?: string;
  labelAdornment?: ReactNode;
  style?: object;
  children: ReactNode;
};

function Field({ label, error, labelAdornment, style, children }: FieldProps) {
  return (
    <View style={[styles.field, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelAdornment}
      </View>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type PersonalInfoScreenProps = {
  onPressBack?: () => void;
};

export default function PersonalInfoScreen({ onPressBack }: PersonalInfoScreenProps) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<AccountGender | ''>('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isGenderSheetOpen, setIsGenderSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;
    getProfiles()
      .then((data) => {
        if (!isActive) return;
        const current: AccountProfile | undefined = data.find((item) => item.isSelf) ?? data[0];
        if (!current) return;
        const names = splitFullName(current.fullName);
        setProfile(current);
        setLastName(names.lastName.toUpperCase());
        setFirstName(names.firstName.toUpperCase());
        setBirthDate(BIRTH_DATE_PATTERN.test(current.birthDate ?? '') ? (current.birthDate ?? '') : '');
        setGender(parseGender(current.gender));
        setEmail(current.email ?? '');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const clearError = (key: string) => setErrors((previous) => ({ ...previous, [key]: undefined }));

  const validate = () => {
    const nextErrors: Partial<Record<string, string>> = {};
    if (!lastName.trim()) nextErrors.lastName = 'Vui lòng nhập họ và tên lót';
    if (!firstName.trim()) nextErrors.firstName = 'Vui lòng nhập tên';
    if (!isValidBirthDate(birthDate)) nextErrors.birthDate = 'Ngày sinh không hợp lệ';
    if (!gender) nextErrors.gender = 'Chọn giới tính';
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Email không hợp lệ';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validate() || !gender) return;
    try {
      setIsSubmitting(true);
      await updatePersonalInfo({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        birthDate,
        gender,
        email: email.trim(),
      });
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.', [
        { text: 'OK', onPress: () => onPressBack?.() },
      ]);
    } catch {
      Alert.alert('Không thể cập nhật', 'Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    key: string,
    value: string,
    onChangeText: (text: string) => void,
    props: Pick<TextInputProps, 'placeholder' | 'keyboardType' | 'autoCapitalize'>,
    adornment?: ReactNode,
  ) => (
    <View style={[styles.inputBox, !!errors[key] && styles.inputBoxError]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          clearError(key);
        }}
        placeholderTextColor={COLORS.PLACEHOLDER}
        {...props}
      />
      {adornment}
    </View>
  );

  const selectedGenderLabel = GENDER_OPTIONS.find((option) => option.value === gender)?.label;

  const renderForm = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
        </View>
      );
    }
    if (!profile) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Chưa có hồ sơ khám bệnh.</Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
        </View>

        <Field
          label="Số điện thoại"
          labelAdornment={<LockIcon size={14} color={COLORS.ICON_MUTED} />}
        >
          <View style={[styles.inputBox, styles.inputBoxLocked]}>
            <Text style={styles.lockedText}>{maskPhone(profile.phone)}</Text>
          </View>
        </Field>

        <Field label="Họ và tên lót" error={errors.lastName}>
          {renderInput('lastName', lastName, (text) => setLastName(text.toUpperCase()), {
            placeholder: 'Họ và tên lót',
            autoCapitalize: 'characters',
          })}
        </Field>

        <Field label="Tên" error={errors.firstName}>
          {renderInput('firstName', firstName, (text) => setFirstName(text.toUpperCase()), {
            placeholder: 'Tên',
            autoCapitalize: 'characters',
          })}
        </Field>

        <View style={styles.row}>
          <Field label="Ngày sinh" error={errors.birthDate} style={styles.flex}>
            {renderInput(
              'birthDate',
              birthDate,
              (text) => setBirthDate(formatBirthDateInput(text)),
              { placeholder: 'DD/MM/YYYY', keyboardType: 'number-pad' },
              <CalendarIcon size={18} color={COLORS.PRIMARY_LIGHT} />,
            )}
          </Field>

          <Field label="Giới tính" error={errors.gender} style={styles.flex}>
            <TouchableOpacity
              style={[styles.inputBox, !!errors.gender && styles.inputBoxError]}
              activeOpacity={0.8}
              onPress={() => setIsGenderSheetOpen(true)}
            >
              <Text style={[styles.input, styles.selectText, !gender && styles.placeholderText]}>
                {selectedGenderLabel ?? 'Chọn'}
              </Text>
              <ChevronDownIcon size={18} color={COLORS.PRIMARY_LIGHT} />
            </TouchableOpacity>
          </Field>
        </View>

        <Field label="Email" error={errors.email}>
          {renderInput('email', email, setEmail, {
            placeholder: 'Email...',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
          })}
        </Field>
      </ScrollView>
    );
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} locations={[0, 0.35]} style={styles.flex}>
      <ScreenContainer style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity hitSlop={10} onPress={onPressBack}>
            <ArrowLeftIcon size={24} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        </View>

        {profile && (
          <View style={styles.summary}>
            <View style={styles.summaryAvatar}>
              <UserIcon size={30} color={COLORS.SURFACE} strokeWidth={1.8} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {profile.fullName.toUpperCase()}
              </Text>
              <View style={styles.phoneChip}>
                <PhoneIcon size={12} color={COLORS.PRIMARY_LIGHT} />
                <Text style={styles.phoneChipText}>{maskPhone(profile.phone)}</Text>
              </View>
            </View>
          </View>
        )}

        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {renderForm()}

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={[styles.submitButton, (isSubmitting || !profile) && styles.submitDisabled]}
              activeOpacity={0.85}
              disabled={isSubmitting || !profile}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.SURFACE} />
              ) : (
                <Text style={styles.submitText}>Cập nhật thông tin</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>

      <Modal
        visible={isGenderSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsGenderSheetOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsGenderSheetOpen(false)} />
          <View style={[styles.genderSheet, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.genderTitle}>Chọn giới tính</Text>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = option.value === gender;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.genderOption}
                  activeOpacity={0.8}
                  onPress={() => {
                    setGender(option.value);
                    clearError('gender');
                    setIsGenderSheetOpen(false);
                  }}
                >
                  <Text style={[styles.genderLabel, isSelected && { color: COLORS.PRIMARY_LIGHT }]}>
                    {option.label}
                  </Text>
                  {isSelected && <CheckIcon size={18} color={COLORS.PRIMARY_LIGHT} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingBottom: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 10,
  },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 18, color: COLORS.PRIMARY },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: SCREEN_PADDING,
    marginBottom: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  summaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryName: { fontFamily: FONTS.BOLD, fontSize: 16, color: NAVY },
  phoneChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#DCEBFA',
  },
  phoneChipText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: COLORS.SURFACE,
  },
  formContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  sectionBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: COLORS.PRIMARY_LIGHT },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 17, color: NAVY },
  field: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    marginTop: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: FIELD_BACKGROUND,
  },
  inputBoxError: { borderColor: COLORS.DANGER },
  inputBoxLocked: { backgroundColor: '#E8EEF5' },
  lockedText: { fontFamily: FONTS.REGULAR, fontSize: 14, color: COLORS.TEXT_MUTED },
  input: { flex: 1, height: 50, fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: NAVY },
  selectText: { lineHeight: 50 },
  placeholderText: { color: COLORS.PLACEHOLDER },
  errorText: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.DANGER },
  row: { flexDirection: 'row', gap: 12 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.SURFACE,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.SURFACE },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(19, 29, 37, 0.4)' },
  genderSheet: {
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.SURFACE,
  },
  genderTitle: { marginBottom: 8, fontFamily: FONTS.BOLD, fontSize: 16, color: COLORS.TEXT },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  genderLabel: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.TEXT },
});