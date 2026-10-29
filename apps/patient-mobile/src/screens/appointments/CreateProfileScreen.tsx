import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import ScreenHeader from '../../components/ScreenHeader';
import { IdCardIcon, PhoneIcon, UserIcon } from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type IconProps = { size?: number; color?: string; strokeWidth?: number };

function createIcon(render: () => ReactNode) {
  return function Icon({ size = 20, color = COLORS.PRIMARY, strokeWidth = 2 }: IconProps) {
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

const CalendarIcon = createIcon(() => (
  <>
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </>
));

const ChevronDownIcon = createIcon(() => <Path d="m6 9 6 6 6-6" />);

const ShieldCheckIcon = createIcon(() => (
  <>
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <Path d="m9 12 2 2 4-4" />
  </>
));

const MapPinIcon = createIcon(() => (
  <>
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <Circle cx="12" cy="10" r="3" />
  </>
));

function ClearIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill="#C0C7D0" />
      <Path
        d="m8.5 8.5 7 7M15.5 8.5l-7 7"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

type Gender = 'MALE' | 'FEMALE';

export type ProfileFormValues = {
  lastName: string;
  firstName: string;
  birthDate: string;
  ethnicity: string;
  gender: Gender;
  occupation: string;
  relationship: string;
  phone: string;
  email: string;
  nationalId: string;
  passportNumber: string;
  personalIdNumber: string;
  country: string;
  province: string;
  ward: string;
  street: string;
};

type FormErrors = Partial<Record<keyof ProfileFormValues, string>>;

const DEFAULT_COUNTRY = 'Việt Nam';
const PHONE_PATTERN = /^(0|\+84)\d{9}$/;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const NATIONAL_ID_PATTERN = /^\d{12}$/;
const BIRTH_DATE_PATTERN = /^(\d{2}) \/ (\d{2}) \/ (\d{4})$/;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
];

const SAMPLE_ETHNICITIES = [
  'Kinh', 'Tày', 'Thái', 'Mường', 'Khmer', 'Hoa', 'Nùng', "H'Mông", 'Dao',
  'Gia Rai', 'Ê Đê', 'Ba Na', 'Xơ Đăng', 'Sán Chay', 'Cơ Ho', 'Chăm', 'Khác',
];
const SAMPLE_COUNTRIES = ['Việt Nam', 'Lào', 'Campuchia', 'Nhật Bản', 'Hàn Quốc', 'Hoa Kỳ', 'Khác'];
const SAMPLE_PROVINCES = ['Hà Nội', 'Đà Nẵng', 'TP. Hồ Chí Minh'];
const SAMPLE_WARDS_BY_PROVINCE: Record<string, string[]> = {
  'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Cầu Giấy'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà'],
  'TP. Hồ Chí Minh': ['Bến Nghé', 'Võ Thị Sáu', 'Tân Định'],
};

const INITIAL_VALUES: ProfileFormValues = {
  lastName: '',
  firstName: '',
  birthDate: '',
  ethnicity: '',
  gender: 'MALE',
  occupation: '',
  relationship: '',
  phone: '',
  email: '',
  nationalId: '',
  passportNumber: '',
  personalIdNumber: '',
  country: DEFAULT_COUNTRY,
  province: '',
  ward: '',
  street: '',
};

const formatBirthDateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(' / ');
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

type FieldProps = {
  label: string;
  labelNote?: string;
  isRequired?: boolean;
  hint?: string;
  footnote?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

function Field({ label, labelNote, isRequired, hint, footnote, error, style, children }: FieldProps) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>
        {label}
        {isRequired ? <Text style={styles.required}> *</Text> : null}
        {labelNote ? <Text style={styles.labelNote}> {labelNote}</Text> : null}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type TextFieldProps = Omit<FieldProps, 'children'> &
  Pick<TextInputProps, 'value' | 'placeholder' | 'keyboardType' | 'autoCapitalize'> & {
    onChangeText: (value: string) => void;
    rightAdornment?: ReactNode;
  };

function TextField({
  value,
  placeholder,
  keyboardType,
  autoCapitalize,
  onChangeText,
  rightAdornment,
  error,
  ...fieldProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <Field error={error} {...fieldProps}>
      <View
        style={[
          styles.inputBox,
          isFocused && styles.inputBoxFocused,
          !!error && styles.inputBoxError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={COLORS.PLACEHOLDER}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightAdornment}
      </View>
    </Field>
  );
}

type SelectFieldProps = Omit<FieldProps, 'children'> & {
  value: string;
  placeholder: string;
  options: string[];
  emptyMessage?: string;
  canClear?: boolean;
  onChange: (value: string) => void;
  onClear?: () => void;
};

function SelectField({
  value,
  placeholder,
  options,
  emptyMessage = 'Không có dữ liệu',
  canClear,
  onChange,
  onClear,
  error,
  ...fieldProps
}: SelectFieldProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <Field error={error} {...fieldProps}>
      <TouchableOpacity
        style={[styles.inputBox, !!error && styles.inputBoxError]}
        activeOpacity={0.8}
        onPress={() => setIsOpen(true)}
      >
        <Text
          style={[styles.input, styles.selectText, !value && { color: COLORS.PLACEHOLDER }]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        {canClear && value ? (
          <TouchableOpacity hitSlop={8} onPress={onClear} style={styles.clearButton}>
            <ClearIcon size={18} />
          </TouchableOpacity>
        ) : null}
        <ChevronDownIcon size={18} color={COLORS.ICON_MUTED} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.sheetTitle}>{fieldProps.label}</Text>
            {options.length === 0 ? (
              <Text style={styles.sheetEmpty}>{emptyMessage}</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = item === value;
                  return (
                    <TouchableOpacity style={styles.sheetOption} onPress={() => handleSelect(item)}>
                      <Text style={[styles.sheetOptionText, isSelected && styles.sheetOptionTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </Field>
  );
}

type FormCardProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function FormCard({ title, icon, children }: FormCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

type CreateProfileScreenProps = {
  onPressBack?: () => void;
  onPressScan?: () => void;
  onSubmit?: (values: ProfileFormValues) => Promise<void> | void;
};

export default function CreateProfileScreen({
  onPressBack,
  onPressScan,
  onSubmit,
}: CreateProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<ProfileFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleCountryChange = (country: string) => {
    setValues((previous) => ({ ...previous, country, province: '', ward: '' }));
    setErrors((previous) => ({ ...previous, country: undefined, province: undefined, ward: undefined }));
  };

  const handleProvinceChange = (province: string) => {
    setValues((previous) => ({ ...previous, province, ward: '' }));
    setErrors((previous) => ({ ...previous, province: undefined, ward: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!values.lastName.trim()) nextErrors.lastName = 'Vui lòng nhập họ và chữ lót';
    if (!values.firstName.trim()) nextErrors.firstName = 'Vui lòng nhập tên người bệnh';
    if (!isValidBirthDate(values.birthDate)) nextErrors.birthDate = 'Ngày sinh không hợp lệ';
    if (!values.ethnicity) nextErrors.ethnicity = 'Vui lòng chọn dân tộc';
    if (!values.occupation.trim()) nextErrors.occupation = 'Vui lòng nhập nghề nghiệp';
    if (!values.relationship.trim()) nextErrors.relationship = 'Vui lòng nhập quan hệ với chủ tài khoản';
    if (!PHONE_PATTERN.test(values.phone)) nextErrors.phone = 'Số điện thoại không hợp lệ';
    if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
      nextErrors.email = 'Email không hợp lệ';
    }
    if (values.nationalId.trim() && !NATIONAL_ID_PATTERN.test(values.nationalId.trim())) {
      nextErrors.nationalId = 'Số CCCD gồm 12 chữ số';
    }
    if (!values.country) nextErrors.country = 'Vui lòng chọn quốc gia';
    if (!values.province) nextErrors.province = 'Vui lòng chọn tỉnh thành';
    if (!values.ward) nextErrors.ward = 'Vui lòng chọn phường xã';
    if (!values.street.trim()) nextErrors.street = 'Vui lòng nhập địa chỉ';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validate()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng kiểm tra các trường được đánh dấu lỗi.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit?.(values);
    } catch {
      Alert.alert('Không thể tạo hồ sơ', 'Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wardOptions = SAMPLE_WARDS_BY_PROVINCE[values.province] ?? [];

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Tạo hồ sơ khám bệnh" onPressBack={onPressBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, styles.quickCard]}>
            <View style={styles.flex}>
              <Text style={styles.quickTitle}>Nhập liệu nhanh</Text>
              <Text style={styles.quickSubtitle}>Sử dụng CCCD để tự động điền thông tin</Text>
            </View>
            <TouchableOpacity style={styles.scanButton} activeOpacity={0.85} onPress={onPressScan}>
              <IdCardIcon size={16} color={COLORS.SURFACE} />
              <Text style={styles.scanText}>QUÉT MÃ</Text>
            </TouchableOpacity>
          </View>

          <FormCard title="Thông tin cá nhân" icon={<UserIcon size={16} color={COLORS.PRIMARY_LIGHT} />}>
            <TextField
              label="Họ và chữ lót"
              labelNote="(KHÔNG ghi tên)"
              hint="(theo CCCD/Hộ chiếu/Giấy khai sinh)"
              isRequired
              placeholder="VD: Nguyễn Văn..."
              autoCapitalize="words"
              value={values.lastName}
              onChangeText={(text) => setField('lastName', text)}
              error={errors.lastName}
            />
            <TextField
              label="Tên người bệnh"
              labelNote="(KHÔNG ghi họ hoặc chữ lót)"
              hint="(theo CCCD/Hộ chiếu/Giấy khai sinh)"
              isRequired
              placeholder="VD: An..."
              autoCapitalize="words"
              value={values.firstName}
              onChangeText={(text) => setField('firstName', text)}
              error={errors.firstName}
            />
            <TextField
              label="Ngày sinh"
              isRequired
              placeholder="DD / MM / YYYY"
              keyboardType="number-pad"
              value={values.birthDate}
              onChangeText={(text) => setField('birthDate', formatBirthDateInput(text))}
              rightAdornment={<CalendarIcon size={18} color={COLORS.ICON_MUTED} />}
              error={errors.birthDate}
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <SelectField
                  label="Dân tộc"
                  isRequired
                  placeholder="Chọn..."
                  value={values.ethnicity}
                  options={SAMPLE_ETHNICITIES}
                  onChange={(option) => setField('ethnicity', option)}
                  error={errors.ethnicity}
                />
              </View>
              <View style={styles.flex}>
                <Field label="Giới tính" isRequired>
                  <View style={styles.genderRow}>
                    {GENDER_OPTIONS.map((option) => {
                      const isSelected = values.gender === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.genderPill, isSelected && styles.genderPillActive]}
                          activeOpacity={0.8}
                          onPress={() => setField('gender', option.value)}
                        >
                          <View style={[styles.radio, isSelected && styles.radioActive]}>
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Field>
              </View>
            </View>

            <TextField
              label="Nghề nghiệp"
              isRequired
              placeholder="Nhập nghề nghiệp..."
              value={values.occupation}
              onChangeText={(text) => setField('occupation', text)}
              error={errors.occupation}
            />
            <TextField
              label="Quan hệ với chủ tài khoản"
              isRequired
              placeholder="Nhập quan hệ với chủ tài khoản (VD: Bản thân, Con...)"
              value={values.relationship}
              onChangeText={(text) => setField('relationship', text)}
              error={errors.relationship}
            />
          </FormCard>

          <FormCard title="Thông tin liên lạc" icon={<PhoneIcon size={16} color={COLORS.PRIMARY_LIGHT} />}>
            <TextField
              label="Số điện thoại"
              isRequired
              placeholder="Số điện thoại..."
              keyboardType="phone-pad"
              value={values.phone}
              onChangeText={(text) => setField('phone', text)}
              error={errors.phone}
            />
            <TextField
              label="Email"
              placeholder="Email (không bắt buộc)..."
              keyboardType="email-address"
              autoCapitalize="none"
              value={values.email}
              onChangeText={(text) => setField('email', text)}
              error={errors.email}
            />
          </FormCard>

          <FormCard title="Giấy tờ định danh" icon={<ShieldCheckIcon size={16} color={COLORS.PRIMARY_LIGHT} />}>
            <TextField
              label="Số CCCD"
              placeholder="Nhập số CCCD..."
              keyboardType="number-pad"
              footnote="(Nếu chưa có CCCD, vui lòng nhập Số định danh cá nhân hoặc Hộ chiếu)"
              value={values.nationalId}
              onChangeText={(text) => setField('nationalId', text)}
              error={errors.nationalId}
            />
            <TextField
              label="Số Hộ chiếu"
              placeholder="Hộ chiếu..."
              autoCapitalize="characters"
              value={values.passportNumber}
              onChangeText={(text) => setField('passportNumber', text)}
            />
            <TextField
              label="Số định danh cá nhân"
              placeholder="Số định danh..."
              keyboardType="number-pad"
              value={values.personalIdNumber}
              onChangeText={(text) => setField('personalIdNumber', text)}
            />
          </FormCard>

          <FormCard title="Địa chỉ" icon={<MapPinIcon size={16} color={COLORS.PRIMARY_LIGHT} />}>
            <SelectField
              label="Quốc gia"
              isRequired
              placeholder="Chọn quốc gia..."
              value={values.country}
              options={SAMPLE_COUNTRIES}
              canClear
              onChange={handleCountryChange}
              onClear={() => handleCountryChange('')}
              error={errors.country}
            />
            <SelectField
              label="Tỉnh thành"
              isRequired
              placeholder="Chọn tỉnh thành..."
              value={values.province}
              options={values.country === DEFAULT_COUNTRY ? SAMPLE_PROVINCES : []}
              emptyMessage="Vui lòng chọn quốc gia Việt Nam trước"
              onChange={handleProvinceChange}
              error={errors.province}
            />
            <SelectField
              label="Phường xã"
              isRequired
              placeholder="Chọn..."
              value={values.ward}
              options={wardOptions}
              emptyMessage="Vui lòng chọn tỉnh thành trước"
              onChange={(option) => setField('ward', option)}
              error={errors.ward}
            />
            <TextField
              label="Số nhà/ Đường/ Khu phố/ Ấp"
              isRequired
              placeholder="Số nhà, tên đường..."
              value={values.street}
              onChangeText={(text) => setField('street', text)}
              error={errors.street}
            />
          </FormCard>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.SURFACE} />
            ) : (
              <Text style={styles.submitText}>TẠO HỒ SƠ KHÁM BỆNH</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: COLORS.BACKGROUND, paddingBottom: 0 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickTitle: { fontFamily: FONTS.BOLD, fontSize: 16, lineHeight: 22, color: COLORS.TEXT },
  quickSubtitle: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.TEXT_MUTED,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  scanText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.SURFACE },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONTS.BOLD, fontSize: 15, lineHeight: 20, color: COLORS.TEXT },
  field: { marginBottom: 16 },
  label: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, lineHeight: 18, color: COLORS.TEXT },
  required: { color: COLORS.DANGER },
  labelNote: { fontFamily: FONTS.REGULAR, color: COLORS.TEXT_MUTED },
  hint: { fontFamily: FONTS.REGULAR, fontSize: 10, lineHeight: 14, color: '#8A96A8' },
  footnote: {
    marginTop: 6,
    fontFamily: FONTS.REGULAR,
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
    color: '#8A96A8',
  },
  errorText: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.DANGER },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    marginTop: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  inputBoxFocused: { borderColor: COLORS.PRIMARY_LIGHT },
  inputBoxError: { borderColor: COLORS.DANGER },
  input: { flex: 1, height: 46, fontFamily: FONTS.REGULAR, fontSize: 14, color: COLORS.TEXT },
  selectText: { lineHeight: 46 },
  clearButton: { paddingHorizontal: 2 },
  row: { flexDirection: 'row', gap: 12 },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  genderPillActive: { borderColor: COLORS.PRIMARY_LIGHT, backgroundColor: COLORS.PRIMARY_TINT },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.ICON_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.PRIMARY_LIGHT },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.PRIMARY_LIGHT },
  genderText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.TEXT_MUTED },
  genderTextActive: { color: COLORS.PRIMARY_LIGHT },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { fontFamily: FONTS.BOLD, fontSize: 14, letterSpacing: 0.4, color: COLORS.SURFACE },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(19, 29, 37, 0.4)' },
  sheet: {
    maxHeight: '60%',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.SURFACE,
  },
  sheetTitle: { fontFamily: FONTS.BOLD, fontSize: 16, color: COLORS.TEXT, marginBottom: 8 },
  sheetEmpty: {
    paddingVertical: 24,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
  },
  sheetOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  sheetOptionText: { fontFamily: FONTS.REGULAR, fontSize: 14, color: COLORS.TEXT },
  sheetOptionTextActive: { fontFamily: FONTS.BOLD, color: COLORS.PRIMARY_LIGHT },
});