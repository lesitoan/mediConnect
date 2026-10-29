import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  type IconProps,
} from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  RESCHEDULE_REASONS,
  formatFee,
  getAppointmentById,
  getScheduleDays,
  rescheduleAppointment,
  type Appointment,
  type AppointmentStatus,
  type AvailabilityLevel,
  type ScheduleDay,
} from '../../services/appointmentService';
import { getProfiles, type Profile } from '../../services/profileService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

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

const CalendarCheckIcon = createIcon(() => (
  <>
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
  </>
));

const WalletIcon = createIcon(() => (
  <>
    <Path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <Path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </>
));

const InfoIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4M12 8h.01" />
  </>
));

const SunIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
));

const SunriseIcon = createIcon(() => (
  <>
    <Path d="M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0" />
  </>
));

const CheckIcon = createIcon(() => <Path d="M20 6 9 17l-5-5" />);

const BUTTON_GRADIENT = ['#3A80B2', '#005B8D'] as const;
const RATING_COLOR = '#F5A524';
const SCREEN_PADDING = 16;
const CARD_PADDING = 16;
const CHIP_GAP = 10;

const SHORT_WEEKDAY: Record<string, string> = {
  'Thứ Hai': 'T2',
  'Thứ Ba': 'T3',
  'Thứ Tư': 'T4',
  'Thứ Năm': 'T5',
  'Thứ Sáu': 'T6',
  'Thứ Bảy': 'T7',
  'Chủ Nhật': 'CN',
};

const STATUS_PILL: Partial<Record<AppointmentStatus, { label: string; background: string; color: string; dot: string }>> = {
  confirmed: { label: 'Đã xác nhận', background: '#E3F6EA', color: '#1E8E4E', dot: '#2BB673' },
  pending: { label: 'Chờ xác nhận', background: '#FFF3D6', color: '#B7791F', dot: '#F5A524' },
};

const AVAILABILITY_META: Record<AvailabilityLevel, { label: string; background: string; color: string }> = {
  available: { label: 'Còn chỗ', background: '#E1F0FC', color: COLORS.PRIMARY_LIGHT },
  limited: { label: 'Sắp hết', background: '#FFF0CC', color: '#B7791F' },
  full: { label: 'Hết chỗ', background: '#ECEFF3', color: COLORS.ICON_MUTED },
};

const PERIODS = [
  { key: 'morning', label: 'Buổi sáng (07:30 - 11:30)', Icon: SunriseIcon },
  { key: 'afternoon', label: 'Buổi chiều (13:30 - 16:30)', Icon: SunIcon },
] as const;

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
};

type RescheduleScreenProps = {
  appointmentId: string;
  onPressBack?: () => void;
  onConfirmed?: () => void;
};

export default function RescheduleScreen({
  appointmentId,
  onPressBack,
  onConfirmed,
}: RescheduleScreenProps) {
  const { width } = useWindowDimensions();
  const chipWidth = Math.floor(
    (width - SCREEN_PADDING * 2 - CARD_PADDING * 2 - CHIP_GAP * 2) / 3,
  );

  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const [profiles, foundAppointment, scheduleDays] = await Promise.all([
          getProfiles(),
          getAppointmentById(appointmentId),
          getScheduleDays(appointmentId),
        ]);
        if (!isActive) return;
        setProfile(profiles.find((item) => item.isSelf) ?? profiles[0] ?? null);
        setAppointment(foundAppointment);
        setDays(scheduleDays);
        setSelectedDate(scheduleDays.find((item) => item.availability !== 'full')?.date ?? null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [appointmentId]);

  const selectedDay = days.find((item) => item.date === selectedDate) ?? null;
  const canSubmit = !!(selectedDay && selectedTime && selectedReason);
  const monthLabel = (selectedDay ?? days[0])?.date.slice(3);

  const handleSelectDay = (day: ScheduleDay) => {
    if (day.availability === 'full') return;
    setSelectedDate(day.date);
    const currentSlot = day.slots.find((slot) => slot.time === selectedTime);
    if (!currentSlot?.isAvailable) setSelectedTime(null);
  };

  const handleConfirm = async () => {
    if (!appointment || !selectedDay || !selectedTime || !selectedReason || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await rescheduleAppointment(appointment.id, {
        day: selectedDay,
        time: selectedTime,
        reason: selectedReason,
      });
      Alert.alert(
        'Đổi lịch thành công',
        `Lịch hẹn mới: ${selectedTime} • ${selectedDay.weekday} (${selectedDay.date})`,
        [{ text: 'Đóng', onPress: onConfirmed }],
        { cancelable: false },
      );
    } catch {
      Alert.alert('Không thể đổi lịch', 'Vui lòng thử lại sau');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
        </View>
      );
    }

    if (!appointment) {
      return (
        <View style={styles.centered}>
          <Text style={styles.messageText}>Không tìm thấy lịch hẹn</Text>
        </View>
      );
    }

    const statusPill = STATUS_PILL[appointment.status];

    return (
      <>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, styles.profileCard]}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>
                {profile ? getInitials(profile.fullName) : '--'}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile ? profile.fullName.toUpperCase() : ''}
              </Text>
              {profile && <Text style={styles.profileCode}>Mã BN: {profile.code}</Text>}
            </View>
            <ShieldCheckIcon size={20} color="#AAB4C2" />
          </View>

          <View style={styles.card}>
            <LinearGradient
              colors={BUTTON_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentBar}
            />
            <View style={styles.currentHeader}>
              <View style={styles.currentTitleRow}>
                <CalendarCheckIcon size={16} color={COLORS.PRIMARY_LIGHT} />
                <Text style={styles.currentTitle}>Lịch hẹn hiện tại:</Text>
              </View>
              {statusPill && (
                <View style={[styles.statusPill, { backgroundColor: statusPill.background }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusPill.dot }]} />
                  <Text style={[styles.statusText, { color: statusPill.color }]}>
                    {statusPill.label}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.doctorBox}>
              <View style={styles.doctorAvatarWrap}>
                <View style={styles.doctorAvatar}>
                  {appointment.doctorImageUrl ? (
                    <Image
                      source={{ uri: appointment.doctorImageUrl }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={[COLORS.PRIMARY_TINT, COLORS.LOGO_GRADIENT_END]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[StyleSheet.absoluteFill, styles.doctorAvatarPlaceholder]}
                    >
                      <UserIcon size={28} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.6} />
                    </LinearGradient>
                  )}
                </View>
                <View style={styles.verifiedBadge}>
                  <ShieldCheckIcon size={10} color={COLORS.SURFACE} strokeWidth={2.4} />
                </View>
              </View>
              <View style={styles.doctorInfo}>
                <View style={styles.doctorNameRow}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {appointment.doctorName}
                  </Text>
                  {appointment.rating !== undefined && (
                    <View style={styles.ratingRow}>
                      <StarIcon
                        size={11}
                        color={RATING_COLOR}
                        fill={RATING_COLOR}
                        strokeWidth={1}
                      />
                      <Text style={styles.ratingText}>{appointment.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.doctorSpecialty} numberOfLines={2}>
                  {appointment.specialty} • {appointment.expertise}
                </Text>
              </View>
            </View>

            <View style={styles.timesRow}>
              <View style={styles.timesCol}>
                <View style={styles.timesHead}>
                  <ClockIcon size={13} color={COLORS.PRIMARY_LIGHT} />
                  <Text style={styles.timesLabel}>Thời gian cũ:</Text>
                </View>
                <Text style={styles.timesValue}>
                  {appointment.time} • {SHORT_WEEKDAY[appointment.weekday] ?? appointment.weekday},
                  {'\n'}
                  {appointment.date}
                </Text>
              </View>
              <View style={styles.timesCol}>
                <View style={styles.timesHead}>
                  <MapPinIcon size={13} color={COLORS.PRIMARY_LIGHT} />
                  <Text style={styles.timesLabel}>Địa điểm:</Text>
                </View>
                <Text style={styles.timesValue}>
                  {appointment.room}, {appointment.building}
                </Text>
              </View>
            </View>

            {appointment.advanceFee !== undefined && (
              <View style={styles.feeRow}>
                <WalletIcon size={16} color={COLORS.PRIMARY_LIGHT} />
                <Text style={styles.feeLabel}>Phí khám thanh toán:</Text>
                <Text style={styles.feeValue}>{formatFee(appointment.advanceFee)}</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Chọn ngày khám mới</Text>
              </View>
              {!!monthLabel && (
                <View style={styles.monthRow}>
                  <Text style={styles.monthText}>Tháng {monthLabel}</Text>
                  <CalendarIcon size={14} color={COLORS.PRIMARY_LIGHT} />
                </View>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayRow}
            >
              {days.map((day) => {
                const isSelected = day.date === selectedDate;
                const isFull = day.availability === 'full';
                const meta = AVAILABILITY_META[day.availability];
                return (
                  <TouchableOpacity
                    key={day.date}
                    style={[
                      styles.dayCard,
                      isSelected && styles.dayCardSelected,
                      isFull && styles.dayCardFull,
                    ]}
                    activeOpacity={0.8}
                    disabled={isFull}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text style={styles.dayWeekday}>{day.shortWeekday}</Text>
                    <Text style={styles.dayNumber}>{day.day}</Text>
                    <View style={[styles.dayPill, { backgroundColor: meta.background }]}>
                      <Text style={[styles.dayPillText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Chọn khung giờ{'\n'}khám</Text>
              </View>
              <Text style={styles.stepAside}>Khám với {appointment.doctorName}</Text>
            </View>

            {!selectedDay ? (
              <Text style={styles.messageText}>Vui lòng chọn ngày khám trước</Text>
            ) : (
              PERIODS.map((period) => {
                const slots = selectedDay.slots.filter((slot) => slot.period === period.key);
                if (slots.length === 0) return null;
                return (
                  <View key={period.key} style={styles.period}>
                    <View style={styles.periodHeader}>
                      <period.Icon size={16} color={COLORS.PRIMARY_LIGHT} />
                      <Text style={styles.periodLabel}>{period.label}</Text>
                    </View>
                    <View style={styles.chipGrid}>
                      {slots.map((slot) => {
                        const isSelected = slot.time === selectedTime;
                        return (
                          <TouchableOpacity
                            key={slot.time}
                            style={[
                              styles.timeChip,
                              { width: chipWidth },
                              isSelected && styles.timeChipSelected,
                              !slot.isAvailable && styles.timeChipDisabled,
                            ]}
                            activeOpacity={0.8}
                            disabled={!slot.isAvailable}
                            onPress={() => setSelectedTime(slot.time)}
                          >
                            {isSelected && <CheckIcon size={14} color={COLORS.SURFACE} strokeWidth={3} />}
                            <Text
                              style={[
                                styles.timeChipText,
                                isSelected && styles.timeChipTextSelected,
                                !slot.isAvailable && styles.timeChipTextDisabled,
                              ]}
                            >
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Lý do đổi lịch khám</Text>
              </View>
            </View>
            <View style={styles.reasonList}>
              {RESCHEDULE_REASONS.map((reason) => {
                const isSelected = reason === selectedReason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedReason(reason)}
                  >
                    {isSelected && <CheckCircleIcon size={16} color={COLORS.SURFACE} />}
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.policyBox}>
            <InfoIcon size={18} color={COLORS.PRIMARY_LIGHT} />
            <View style={styles.policyTextBlock}>
              <Text style={styles.policyTitle}>Chính sách MediConnect</Text>
              <Text style={styles.policyBody}>
                Miễn phí đổi lịch khám trước 02 giờ.
                {appointment.advanceFee !== undefined &&
                  ` Chi phí tạm ứng ${formatFee(appointment.advanceFee)} từ hồ sơ y tế điện tử sẽ tự động đồng bộ sang lịch hẹn mới${selectedDay ? ` ngày ${selectedDay.date}` : ''}.`}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Lịch hẹn mới được chọn:</Text>
          <View style={styles.footerRow}>
            <View style={styles.footerSlot}>
              <CalendarCheckIcon
                size={20}
                color={selectedTime ? COLORS.PRIMARY_LIGHT : COLORS.ICON_MUTED}
              />
              <Text
                style={[styles.footerSlotText, !selectedTime && styles.footerSlotTextEmpty]}
                numberOfLines={1}
              >
                {selectedDay && selectedTime
                  ? `${selectedTime} • ${selectedDay.weekday} (${selectedDay.date})`
                  : 'Chưa chọn khung giờ'}
              </Text>
            </View>
            <View style={styles.roomPill}>
              <Text style={styles.roomPillText}>{appointment.room}</Text>
              <Text style={styles.roomPillSub}>{appointment.building}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, !canSubmit && styles.confirmButtonDisabled]}
            activeOpacity={0.85}
            disabled={!canSubmit || isSubmitting}
            onPress={handleConfirm}
          >
            <LinearGradient
              colors={BUTTON_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButtonInner}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.SURFACE} />
              ) : (
                <>
                  <CheckCircleIcon size={18} color={COLORS.SURFACE} />
                  <Text style={styles.confirmButtonText}>XÁC NHẬN ĐỔI LỊCH KHÁM</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack} hitSlop={10}>
          <ArrowLeftIcon size={24} color={COLORS.PRIMARY_LIGHT} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Đổi lịch khám</Text>
          {appointment && <Text style={styles.headerSub}>Phiếu khám #{appointment.code}</Text>}
        </View>
      </View>
      {renderContent()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.BACKGROUND },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageText: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 52,
    paddingHorizontal: SCREEN_PADDING,
  },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 17, lineHeight: 22, color: COLORS.TEXT },
  headerSub: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  content: { gap: 14, paddingHorizontal: SCREEN_PADDING, paddingTop: 10, paddingBottom: 20 },
  card: {
    padding: CARD_PADDING,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D6E8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.PRIMARY_LIGHT },
  profileText: { flex: 1 },
  profileName: { fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 20, color: COLORS.TEXT },
  profileCode: { fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  accentBar: {
    height: 5,
    marginHorizontal: -CARD_PADDING,
    marginTop: -CARD_PADDING,
    marginBottom: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currentTitle: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: FONTS.BOLD, fontSize: 11 },
  doctorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#EAF3FC',
  },
  doctorAvatarWrap: { width: 56, height: 56 },
  doctorAvatar: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden' },
  doctorAvatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1 },
  doctorNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  doctorName: { flex: 1, fontFamily: FONTS.BOLD, fontSize: 15, lineHeight: 20, color: COLORS.TEXT },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: FONTS.BOLD, fontSize: 11, color: COLORS.TEXT },
  doctorSpecialty: {
    marginTop: 2,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.PRIMARY_LIGHT,
  },
  timesRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  timesCol: { flex: 1 },
  timesHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timesLabel: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  timesValue: {
    marginTop: 4,
    fontFamily: FONTS.BOLD,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.TEXT,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY_TINT,
  },
  feeLabel: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  feeValue: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.PRIMARY_LIGHT },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  stepTitle: { flexShrink: 1, fontFamily: FONTS.BOLD, fontSize: 15, lineHeight: 20, color: COLORS.TEXT },
  stepAside: {
    maxWidth: '38%',
    textAlign: 'right',
    fontFamily: FONTS.REGULAR,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.TEXT_MUTED,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  monthText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  dayRow: { gap: 10, paddingTop: 14, paddingBottom: 4 },
  dayCard: {
    width: 72,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE8F5',
    backgroundColor: COLORS.SURFACE,
  },
  dayCardSelected: {
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY_LIGHT,
    backgroundColor: '#E3F0FC',
  },
  dayCardFull: { opacity: 0.55 },
  dayWeekday: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  dayNumber: { marginTop: 4, fontFamily: FONTS.BOLD, fontSize: 20, lineHeight: 26, color: COLORS.TEXT },
  dayPill: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  dayPillText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 10 },
  period: { marginTop: 14 },
  periodHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CHIP_GAP, marginTop: 10 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE8F5',
    backgroundColor: '#EEF5FD',
  },
  timeChipSelected: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY },
  timeChipDisabled: { borderColor: '#ECEFF3', backgroundColor: '#F4F6F9' },
  timeChipText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.TEXT },
  timeChipTextSelected: { color: COLORS.SURFACE },
  timeChipTextDisabled: { color: '#B6BFCB', textDecorationLine: 'line-through' },
  reasonList: { alignItems: 'flex-start', gap: 10, marginTop: 14 },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#DCE8F5',
    backgroundColor: COLORS.SURFACE,
  },
  reasonChipSelected: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY },
  reasonText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.TEXT_MUTED },
  reasonTextSelected: { color: COLORS.SURFACE },
  policyBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: '#E8F2FC',
  },
  policyTextBlock: { flex: 1 },
  policyTitle: { fontFamily: FONTS.BOLD, fontSize: 13, lineHeight: 18, color: COLORS.PRIMARY_LIGHT },
  policyBody: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.TEXT_MUTED,
  },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  footerLabel: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  footerSlot: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerSlotText: { flexShrink: 1, fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.PRIMARY },
  footerSlotTextEmpty: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.ICON_MUTED },
  roomPill: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E3F0FC',
  },
  roomPillText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.PRIMARY },
  roomPillSub: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.PRIMARY_LIGHT },
  confirmButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  confirmButtonText: { fontFamily: FONTS.BOLD, fontSize: 14, letterSpacing: 0.3, color: COLORS.SURFACE },
});