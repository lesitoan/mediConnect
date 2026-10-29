import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BookingStepper from '../../components/BookingStepper';
import ScreenContainer from '../../components/ScreenContainer';
import ScreenHeader from '../../components/ScreenHeader';
import { UserIcon } from '../../components/icons';
import {
  BanknoteIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardListIcon,
  InfoFilledIcon,
  InfoIcon,
  MedicalSquareIcon,
  ShieldFilledIcon,
  SPECIALTY_ICONS,
  UserCheckIcon,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  createAppointment,
  type CreatedAppointment,
} from '../../services/bookingService';
import type { Profile } from '../../services/profileService';
import type { Doctor, ScheduleDay, TimeSlot } from '../../services/scheduleService';
import type { Specialty, SpecialtyService } from '../../services/specialtyService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type BookingProfile = Profile & {
  birthDate?: string;
  gender?: string;
  nationalId?: string;
};

const BOOKING_STEPS = ['Hồ sơ', 'Khoa khám', 'Bác sĩ', 'Xác nhận'];
const CURRENT_STEP_INDEX = 3;
const SCREEN_PADDING = 16;
const CONFIRM_GRADIENT = ['#3B8CCB', '#0A5C8E'] as const;
const STRIP_GRADIENT = ['#0A5A8C', '#5AB3E3'] as const;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const LINK_TEAL = '#0E7C86';
const ICON_CIRCLE_BACKGROUND = '#DCEBFA';
const SUCCESS_TEXT = '#1E9E6A';
const SUCCESS_BACKGROUND = '#E3F7EE';
const WARNING_BACKGROUND = '#FFF8E6';
const WARNING_BORDER = '#F3D98B';
const WARNING_TEXT = '#8A4B00';
const WARNING_ICON = '#E8A317';
const MASK_DOT = '●';
const PLACEHOLDER_VALUE = '—';

const SAMPLE_LOCATION = {
  room: 'Phòng 302, Tầng 3, Tòa A',
  facility: 'Trung tâm Kỹ thuật cao MediConnect',
};

const WEEKDAY_NAMES: Record<string, string> = {
  'Thứ 2': 'Thứ Hai',
  'Thứ 3': 'Thứ Ba',
  'Thứ 4': 'Thứ Tư',
  'Thứ 5': 'Thứ Năm',
  'Thứ 6': 'Thứ Sáu',
  'Thứ 7': 'Thứ Bảy',
  CN: 'Chủ Nhật',
};

const GENDER_NAMES: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
};

const pad = (value: number) => String(value).padStart(2, '0');
const formatFee = (value: number) => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;

const maskValue = (value: string, visibleStart: number, visibleEnd: number) => {
  if (value.length <= visibleStart + visibleEnd) return value;
  const hiddenCount = value.length - visibleStart - visibleEnd;
  return [
    value.slice(0, visibleStart),
    Array(hiddenCount).fill(MASK_DOT).join(' '),
    value.slice(value.length - visibleEnd),
  ]
    .filter(Boolean)
    .join(' ');
};

type SectionCardProps = {
  title: string;
  icon: ReactNode;
  right?: ReactNode;
  hasStrip?: boolean;
  children: ReactNode;
};

function SectionCard({ title, icon, right, hasStrip, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {hasStrip && (
        <LinearGradient
          colors={STRIP_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardStrip}
        />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>{icon}</View>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.flex} />
          {right}
        </View>
        {children}
      </View>
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  isHighlighted?: boolean;
};

function InfoRow({ label, value, isHighlighted }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, isHighlighted && styles.infoValueHighlighted]}>{value}</Text>
    </View>
  );
}

type DetailRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
  isValueLarge?: boolean;
};

function DetailRow({ icon, label, value, subValue, isValueLarge }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelBox}>
        {icon}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.detailValueBox}>
        <Text style={[styles.detailValue, isValueLarge && styles.detailValueLarge]}>{value}</Text>
        {subValue ? <Text style={styles.detailSubValue}>{subValue}</Text> : null}
      </View>
    </View>
  );
}

function DashedDivider() {
  return (
    <View style={styles.dashedClip}>
      <View style={styles.dashedLine} />
    </View>
  );
}

type ConfirmBookingScreenProps = {
  profile: BookingProfile;
  specialty: Specialty;
  service: SpecialtyService;
  doctor: Doctor;
  day: ScheduleDay;
  slot: TimeSlot;
  onPressBack?: () => void;
  onPressHome?: () => void;
  onConfirmed?: (appointment: CreatedAppointment) => void;
};

export default function ConfirmBookingScreen({
  profile,
  service,
  doctor,
  day,
  slot,
  onPressBack,
  onPressHome,
  onConfirmed,
}: ConfirmBookingScreenProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const StethoscopeIcon = SPECIALTY_ICONS.STETHOSCOPE;

  const weekdayName = WEEKDAY_NAMES[day.weekdayLabel] ?? day.weekdayLabel;
  const dayText = `${weekdayName}, ngày ${pad(day.day)}/${pad(day.month)}/${day.year}`;
  const birthAndGender = [
    profile.birthDate ?? PLACEHOLDER_VALUE,
    profile.gender ? (GENDER_NAMES[profile.gender] ?? profile.gender) : null,
  ]
    .filter(Boolean)
    .join(' • ');
  const canConfirm = hasAgreed && !isSubmitting;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      setIsSubmitting(true);
      const appointment = await createAppointment({
        profileId: profile.id,
        serviceId: service.id,
        doctorId: doctor.id,
        dateKey: day.dateKey,
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        note: note.trim(),
      });
      onConfirmed?.(appointment);
    } catch {
      Alert.alert('Không thể đặt hẹn', 'Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Xác nhận thông tin" onPressBack={onPressBack} onPressHome={onPressHome} />
      <BookingStepper
        steps={BOOKING_STEPS}
        currentIndex={CURRENT_STEP_INDEX}
        hasCard
        shouldShowCurrentDot
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.notice}>
            <ShieldFilledIcon size={20} color={COLORS.PRIMARY} />
            <Text style={styles.noticeText}>Vui lòng rà soát kỹ thông tin phiếu hẹn</Text>
          </View>

          <SectionCard
            title="Thông tin người bệnh"
            icon={<UserIcon size={18} color={COLORS.PRIMARY_LIGHT} />}
            right={
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{profile.code}</Text>
              </View>
            }
            hasStrip
          >
            <InfoRow label="Họ và tên" value={profile.fullName.toUpperCase()} isHighlighted />
            <InfoRow label="Ngày sinh & Giới tính" value={birthAndGender} />
            <InfoRow label="Số điện thoại" value={maskValue(profile.phone, 3, 3)} />
            <InfoRow
              label="Số CCCD / Định danh"
              value={profile.nationalId ? maskValue(profile.nationalId, 6, 0) : PLACEHOLDER_VALUE}
            />
          </SectionCard>

          <SectionCard
            title="Chi tiết lịch khám"
            icon={<StethoscopeIcon size={18} color={COLORS.PRIMARY_LIGHT} />}
            right={
              <View style={styles.placePill}>
                <View style={styles.placeDot} />
                <Text style={styles.placePillText}>Tại bệnh viện</Text>
              </View>
            }
          >
            <View style={styles.doctorBox}>
              {doctor.photoUrl ? (
                <Image source={{ uri: doctor.photoUrl }} style={styles.doctorPhoto} />
              ) : (
                <View style={[styles.doctorPhoto, styles.doctorPhotoPlaceholder]}>
                  <UserIcon size={26} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.6} />
                </View>
              )}
              <View style={styles.flex}>
                <Text style={styles.doctorRole}>BÁC SĨ CHUYÊN KHOA</Text>
                <Text style={styles.doctorName}>{doctor.fullName.toUpperCase()}</Text>
              </View>
            </View>

            <DetailRow
              icon={<CalendarIcon size={16} color={COLORS.PRIMARY} />}
              label="Thời gian"
              value={`${slot.startTime} - ${slot.endTime}`}
              subValue={dayText}
              isValueLarge
            />
            <DetailRow
              icon={<BuildingIcon size={16} color={COLORS.PRIMARY} />}
              label="Địa điểm"
              value={SAMPLE_LOCATION.room}
              subValue={SAMPLE_LOCATION.facility}
            />
            <DetailRow
              icon={<MedicalSquareIcon size={16} color={COLORS.PRIMARY} />}
              label="Dịch vụ"
              value={`Khám chuyên khoa ${service.name}`}
            />
          </SectionCard>

          <SectionCard
            title="Chi phí khám dự kiến"
            icon={<BanknoteIcon size={18} color={COLORS.PRIMARY_LIGHT} />}
            right={<Text style={styles.payLater}>Thanh toán sau</Text>}
          >
            <View style={styles.costRow}>
              <Text style={styles.infoLabel}>Phí khám chuyên gia</Text>
              <Text style={styles.costValue}>{formatFee(service.minFee)}</Text>
            </View>
            <View style={styles.costRow}>
              <View style={styles.costLabelRow}>
                <Text style={styles.infoLabel}>BHYT & Bảo lãnh viện phí</Text>
                <InfoIcon size={13} color={MUTED_TEXT} />
              </View>
              <Text style={styles.costLink}>Giảm trừ trực tiếp tại quầy</Text>
            </View>
            <DashedDivider />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tạm tính tại viện</Text>
              <Text style={styles.totalValue}>{formatFee(service.minFee)}</Text>
            </View>
            <Text style={styles.totalNote}>Chưa bao gồm xét nghiệm nếu có chỉ định</Text>
          </SectionCard>

          <View style={styles.card}>
            <View style={styles.cardBody}>
              <View style={styles.noteHeader}>
                <ClipboardListIcon size={18} color={COLORS.PRIMARY} />
                <Text style={styles.noteTitle}>Triệu chứng / Lý do khám</Text>
                <View style={styles.flex} />
                <Text style={styles.optionalText}>Không bắt buộc</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Mô tả triệu chứng hoặc lý do khám..."
                placeholderTextColor={COLORS.PLACEHOLDER}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.warning}>
            <InfoFilledIcon size={20} color={WARNING_ICON} />
            <Text style={styles.warningText}>
              <Text style={styles.warningStrong}>Lưu ý quan trọng:</Text> Quý khách vui lòng có mặt
              trước giờ hẹn <Text style={styles.warningStrong}>15 phút</Text> tại Quầy đón tiếp Tòa A
              để hoàn thiện thủ tục đo huyết áp và sinh hiệu đầu vào.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.agreeRow}
            activeOpacity={0.8}
            onPress={() => setHasAgreed(!hasAgreed)}
          >
            <View style={[styles.checkbox, hasAgreed && styles.checkboxActive]}>
              {hasAgreed && <CheckIcon size={13} color={COLORS.SURFACE} strokeWidth={3} />}
            </View>
            <Text style={styles.agreeText}>
              Tôi xác nhận các thông tin trên là chính xác và đồng ý với{' '}
              <Text style={styles.agreeLink}>Quy định đặt hẹn khám</Text> cùng{' '}
              <Text style={styles.agreeLink}>Chính sách bảo mật dữ liệu y tế</Text> của bệnh viện
              MediConnect.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity activeOpacity={0.85} disabled={!canConfirm} onPress={handleConfirm}>
            {canConfirm || isSubmitting ? (
              <LinearGradient
                colors={CONFIRM_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.SURFACE} />
                ) : (
                  <>
                    <UserCheckIcon size={20} color={COLORS.SURFACE} />
                    <Text style={styles.confirmText}>XÁC NHẬN ĐẶT HẸN</Text>
                  </>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.confirmButton, styles.confirmDisabled]}>
                <UserCheckIcon size={20} color={COLORS.SURFACE} />
                <Text style={styles.confirmText}>XÁC NHẬN ĐẶT HẸN</Text>
              </View>
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
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 14, paddingBottom: 24, gap: 14 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#E6F0FA',
  },
  noticeText: { flex: 1, fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.PRIMARY },
  card: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  cardStrip: { height: 5 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ICON_CIRCLE_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: ICON_CIRCLE_BACKGROUND,
  },
  codeBadgeText: { fontFamily: FONTS.BOLD, fontSize: 11, letterSpacing: 0.5, color: COLORS.PRIMARY },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  infoLabel: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },
  infoValue: { flexShrink: 1, fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },
  infoValueHighlighted: { color: COLORS.PRIMARY },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  placeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS_TEXT },
  placePillText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: SUCCESS_TEXT },
  doctorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EAF2FB',
  },
  doctorPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
  },
  doctorPhotoPlaceholder: {
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorRole: { fontFamily: FONTS.BOLD, fontSize: 11, letterSpacing: 0.4, color: COLORS.PRIMARY_LIGHT },
  doctorName: { marginTop: 2, fontFamily: FONTS.BOLD, fontSize: 16, color: NAVY },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  detailLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 },
  detailValueBox: { flex: 1, alignItems: 'flex-end' },
  detailValue: { textAlign: 'right', fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },
  detailValueLarge: { fontSize: 16, color: COLORS.PRIMARY },
  detailSubValue: {
    marginTop: 2,
    textAlign: 'right',
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  payLater: { fontFamily: FONTS.BOLD, fontSize: 13, color: LINK_TEAL },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
  },
  costLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  costValue: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },
  costLink: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: LINK_TEAL },
  dashedClip: { height: 1, marginVertical: 8, overflow: 'hidden' },
  dashedLine: {
    height: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9D6E4',
    borderRadius: 0,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  totalLabel: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.TEXT },
  totalValue: { fontFamily: FONTS.BOLD, fontSize: 22, color: COLORS.PRIMARY },
  totalNote: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 12, color: MUTED_TEXT },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  noteTitle: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.TEXT },
  optionalText: { fontFamily: FONTS.REGULAR, fontSize: 12, color: MUTED_TEXT },
  noteInput: {
    minHeight: 84,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EEF4FB',
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.TEXT,
  },
  warning: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WARNING_BORDER,
    backgroundColor: WARNING_BACKGROUND,
  },
  warningText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 12, lineHeight: 19, color: WARNING_TEXT },
  warningStrong: { fontFamily: FONTS.BOLD },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: COLORS.PRIMARY },
  agreeText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 12, lineHeight: 20, color: COLORS.TEXT_MUTED },
  agreeLink: { fontFamily: FONTS.BOLD, color: COLORS.PRIMARY, textDecorationLine: 'underline' },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 14,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  confirmDisabled: { backgroundColor: '#B8C4D2' },
  confirmText: { fontFamily: FONTS.BOLD, fontSize: 15, letterSpacing: 0.3, color: COLORS.SURFACE },
});