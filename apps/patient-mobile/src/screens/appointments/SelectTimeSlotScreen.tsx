import { useEffect, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text as RNText,
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
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  InfoIcon,
  ShieldCheckIcon,
  StarIcon,
  SunIcon,
  SunsetIcon,
  type BookingIconProps,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import type { Profile } from '../../services/profileService';
import {
  getTimeSlots,
  SLOT_DURATION_MINUTES,
  type Doctor,
  type ScheduleDay,
  type ShiftId,
  type ShiftSchedule,
  type TimeSlot,
} from '../../services/scheduleService';
import type { Specialty, SpecialtyService } from '../../services/specialtyService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const BOOKING_STEPS = ['Hồ sơ', 'Khoa khám', 'Bác sĩ & Giờ', 'Xác nhận'];
const CURRENT_STEP_INDEX = 2;
const SCREEN_PADDING = 16;
const CARD_PADDING = 16;
const SLOT_GAP = 10;
const FOOTER_GRADIENT = ['#0A5A8C', '#2E74AA'] as const;
const DOCTOR_STRIP_GRADIENT = ['#8FD0F5', '#2D74A8'] as const;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const DANGER_TEXT = '#E5484D';
const VERIFIED_GREEN = '#2EAD6B';
const RATING_COLOR = '#F5A524';
const SLOT_AVAILABLE_BACKGROUND = '#E8F2FC';
const SLOT_AVAILABLE_BORDER = '#B9D6F0';
const SLOT_BOOKED_BACKGROUND = '#F1F4F8';
const SLOT_BOOKED_BORDER = '#E3E8EF';
const SLOT_SELECTED_BACKGROUND = '#2F6FA3';

const SHIFT_ICONS: Record<ShiftId, ComponentType<BookingIconProps>> = {
  MORNING: SunIcon,
  AFTERNOON: SunsetIcon,
};

const pad = (value: number) => String(value).padStart(2, '0');
const formatNumber = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export type TimeSlotSelection = {
  day: ScheduleDay;
  doctor: Doctor;
  slot: TimeSlot;
};

type SelectTimeSlotScreenProps = {
  profile: Profile;
  specialty: Specialty;
  service: SpecialtyService;
  doctor: Doctor;
  day: ScheduleDay;
  onPressBack?: () => void;
  onPressHome?: () => void;
  onPressChangeDay?: () => void;
  onContinue?: (selection: TimeSlotSelection) => void;
};

export default function SelectTimeSlotScreen({
  service,
  doctor,
  day,
  onPressBack,
  onPressHome,
  onPressChangeDay,
  onContinue,
}: SelectTimeSlotScreenProps) {
  const insets = useSafeAreaInsets();
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    getTimeSlots(doctor.id, day.dateKey)
      .then((data) => {
        if (isActive) setShifts(data);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [doctor.id, day.dateKey]);

  const selectedSlot = shifts
    .flatMap((shift) => shift.slots)
    .find((slot) => slot.id === selectedSlotId);
  const canContinue = !!selectedSlot;
  const dayText = `${day.weekdayLabel}, ngày ${pad(day.day)}/${pad(day.month)}/${day.year}`;

  const handleContinue = () => {
    if (selectedSlot) onContinue?.({ day, doctor, slot: selectedSlot });
  };

  const renderSlot = (slot: TimeSlot) => {
    const isSelected = slot.id === selectedSlotId;
    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.slot,
          slot.isAvailable ? styles.slotAvailable : styles.slotBooked,
          isSelected && styles.slotSelected,
        ]}
        activeOpacity={0.85}
        disabled={!slot.isAvailable}
        onPress={() => setSelectedSlotId(slot.id)}
      >
        {isSelected && <View style={styles.slotDot} />}
        <View style={styles.slotTimeRow}>
          {isSelected && <CheckCircleIcon size={14} color={COLORS.SURFACE} />}
          <Text
            style={[
              styles.slotTime,
              isSelected && styles.slotTimeSelected,
              !slot.isAvailable && styles.slotTimeBooked,
            ]}
          >
            {slot.startTime} – {slot.endTime}
          </Text>
        </View>
        {isSelected ? (
          <Text style={styles.slotStatusSelected}>ĐANG CHỌN</Text>
        ) : slot.isAvailable ? (
          <Text style={styles.slotStatusAvailable}>Còn trống</Text>
        ) : (
          <Text style={styles.slotStatusBooked}>Đã kín</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderShift = (shift: ShiftSchedule) => {
    const Icon = SHIFT_ICONS[shift.id];
    const availableCount = shift.slots.filter((slot) => slot.isAvailable).length;
    return (
      <View key={shift.id} style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <View style={styles.shiftIcon}>
            <Icon size={20} color={COLORS.PRIMARY_LIGHT} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.shiftTitle}>{shift.label}</Text>
            <Text style={styles.shiftTime}>
              {shift.startTime} - {shift.endTime}
            </Text>
          </View>
          <View style={styles.shiftChip}>
            <Text style={styles.shiftChipText}>
              {availableCount > 0 ? `${availableCount} chỗ trống` : 'Hết chỗ'}
            </Text>
          </View>
        </View>
        <View style={styles.shiftDivider} />
        <View style={styles.slotGrid}>{shift.slots.map(renderSlot)}</View>
      </View>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Chọn giờ khám" onPressBack={onPressBack} onPressHome={onPressHome} />
      <BookingStepper steps={BOOKING_STEPS} currentIndex={CURRENT_STEP_INDEX} hasCard />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.doctorCard}>
          <LinearGradient
            colors={DOCTOR_STRIP_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doctorStrip}
          />
          <View style={styles.doctorTop}>
            <View>
              {doctor.photoUrl ? (
                <Image source={{ uri: doctor.photoUrl }} style={styles.doctorPhoto} />
              ) : (
                <View style={[styles.doctorPhoto, styles.doctorPhotoPlaceholder]}>
                  <UserIcon size={30} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.6} />
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <CheckIcon size={10} color={COLORS.SURFACE} strokeWidth={3} />
              </View>
            </View>
            <View style={styles.flex}>
              <View style={styles.ratingRow}>
                <StarIcon size={13} color={RATING_COLOR} />
                <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.doctorName}>{doctor.fullName.toUpperCase()}</Text>
              <Text style={styles.doctorPosition}>{doctor.position}</Text>
            </View>
          </View>

          <View style={styles.doctorDivider} />

          <View style={styles.dayBox}>
            <View style={styles.dayIcon}>
              <CalendarIcon size={18} color={COLORS.PRIMARY_LIGHT} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.dayLabel}>Ngày khám đã chọn</Text>
              <Text style={styles.dayValue}>{dayText}</Text>
            </View>
            <TouchableOpacity style={styles.changeDayButton} activeOpacity={0.8} onPress={onPressChangeDay}>
              <Text style={styles.changeDayText}>Đổi ngày</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <ClockIcon size={22} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Chọn khung giờ khám</Text>
          </View>
          <Text style={styles.sectionNote}>{SLOT_DURATION_MINUTES} phút / lượt</Text>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendSelected]} />
            <Text style={styles.legendText}>Đang chọn</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendAvailable]} />
            <Text style={styles.legendText}>Còn trống</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDiamond} />
            <Text style={styles.legendText}>Đã kín</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
          </View>
        ) : (
          shifts.map(renderShift)
        )}

        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <InfoIcon size={18} color={COLORS.PRIMARY_LIGHT} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.noteTitle}>Lưu ý trước giờ khám</Text>
            <Text style={styles.noteText}>
              Bệnh nhân vui lòng có mặt trước giờ khám{' '}
              <Text style={styles.noteStrong}>15 phút</Text> để hoàn tất thủ tục đo sinh hiệu.{' '}
              <Text style={styles.noteStrong}>Miễn phí hủy hoặc đổi lịch trước 02 giờ.</Text>
            </Text>
          </View>
        </View>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <ShieldCheckIcon size={14} color={VERIFIED_GREEN} />
            <Text style={styles.trustText}>Bảo mật Y tế HIPAA</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <CreditCardIcon size={14} color={COLORS.PRIMARY_LIGHT} />
            <Text style={styles.trustText}>Thanh toán sau tại quầy</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryInfo}>
            <View style={styles.summaryLabelRow}>
              <View style={styles.summaryDot} />
              <Text style={styles.summaryLabel}>Khung giờ chọn:</Text>
            </View>
            {selectedSlot ? (
              <>
                <Text style={styles.summaryText} numberOfLines={1}>
                  {doctor.fullName}
                </Text>
                <Text style={styles.summaryText}>
                  {`${selectedSlot.startTime}, ${pad(day.day)}/${pad(day.month)}`}
                </Text>
              </>
            ) : (
              <Text style={styles.summaryEmpty}>Chưa chọn khung giờ</Text>
            )}
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Giá khám tạm tính</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{formatNumber(service.minFee)}</Text>
              <Text style={styles.priceUnit}>đ</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={handleContinue}
          style={canContinue ? styles.continueShadow : undefined}
        >
          {canContinue ? (
            <LinearGradient
              colors={FOOTER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>TIẾP TỤC XÁC NHẬN ĐẶT KHÁM</Text>
              <ArrowRightIcon size={20} color={COLORS.SURFACE} />
            </LinearGradient>
          ) : (
            <View style={[styles.continueButton, styles.continueDisabled]}>
              <Text style={styles.continueText}>TIẾP TỤC XÁC NHẬN ĐẶT KHÁM</Text>
              <ArrowRightIcon size={20} color={COLORS.SURFACE} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: COLORS.BACKGROUND, paddingBottom: 0 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 14, paddingBottom: 24 },
  doctorCard: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  doctorStrip: { height: 5 },
  doctorTop: { flexDirection: 'row', gap: 14, padding: 14, paddingBottom: 12 },
  doctorPhoto: { width: 64, height: 64, borderRadius: 14 },
  doctorPhotoPlaceholder: {
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
    backgroundColor: VERIFIED_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },
  doctorName: { marginTop: 4, fontFamily: FONTS.BOLD, fontSize: 18, lineHeight: 24, color: COLORS.PRIMARY },
  doctorPosition: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  doctorDivider: { height: 1, marginHorizontal: 14, backgroundColor: COLORS.BORDER },
  dayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 14,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#EAF2FB',
  },
  dayIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { fontFamily: FONTS.REGULAR, fontSize: 11, color: MUTED_TEXT },
  dayValue: { marginTop: 2, fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  changeDayButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeDayText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.PRIMARY },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 17, color: COLORS.PRIMARY },
  sectionNote: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4 },
  legendSelected: { backgroundColor: SLOT_SELECTED_BACKGROUND },
  legendAvailable: {
    borderWidth: 1,
    borderColor: SLOT_AVAILABLE_BORDER,
    backgroundColor: SLOT_AVAILABLE_BACKGROUND,
  },
  legendDiamond: {
    width: 11,
    height: 11,
    marginHorizontal: 1,
    backgroundColor: '#7D8A9C',
    transform: [{ rotate: '45deg' }],
  },
  legendText: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  loadingBox: { height: 120, alignItems: 'center', justifyContent: 'center' },
  shiftCard: {
    marginBottom: 14,
    padding: CARD_PADDING,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  shiftHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shiftIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E1EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftTitle: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.TEXT },
  shiftTime: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 11, color: MUTED_TEXT },
  shiftChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: '#DCEBFA',
  },
  shiftChipText: { fontFamily: FONTS.BOLD, fontSize: 11, color: COLORS.PRIMARY },
  shiftDivider: { height: 1, marginVertical: 12, backgroundColor: COLORS.BORDER },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SLOT_GAP,
  },
  slot: {
    width: '48.5%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  slotAvailable: { borderColor: SLOT_AVAILABLE_BORDER, backgroundColor: SLOT_AVAILABLE_BACKGROUND },
  slotBooked: { borderColor: SLOT_BOOKED_BORDER, backgroundColor: SLOT_BOOKED_BACKGROUND },
  slotSelected: { borderColor: NAVY, backgroundColor: SLOT_SELECTED_BACKGROUND },
  slotDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
    backgroundColor: '#5AB3E3',
  },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  slotTime: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  slotTimeSelected: { color: COLORS.SURFACE },
  slotTimeBooked: { color: MUTED_TEXT, textDecorationLine: 'line-through' },
  slotStatusAvailable: { marginTop: 3, fontFamily: FONTS.REGULAR, fontSize: 10, color: COLORS.TEXT_MUTED },
  slotStatusBooked: { marginTop: 3, fontFamily: FONTS.REGULAR, fontSize: 10, color: DANGER_TEXT },
  slotStatusSelected: {
    marginTop: 3,
    fontFamily: FONTS.BOLD,
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#D6E8F8',
  },
  noteCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EAF2FB',
  },
  noteIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D6E8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  noteText: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 12, lineHeight: 19, color: COLORS.TEXT_MUTED },
  noteStrong: { fontFamily: FONTS.BOLD, color: COLORS.PRIMARY },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#B6C2D2' },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.SURFACE,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  summaryInfo: { flex: 1 },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.PRIMARY },
  summaryLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.PRIMARY },
  summaryText: { marginTop: 4, fontFamily: FONTS.BOLD, fontSize: 16, lineHeight: 22, color: COLORS.TEXT },
  summaryEmpty: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 14, color: MUTED_TEXT },
  priceBox: { alignItems: 'flex-end' },
  priceLabel: { fontFamily: FONTS.REGULAR, fontSize: 12, color: MUTED_TEXT },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  priceValue: { fontFamily: FONTS.BOLD, fontSize: 28, color: COLORS.PRIMARY },
  priceUnit: { marginLeft: 4, fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: COLORS.PRIMARY },
  continueShadow: {
    borderRadius: 22,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 22,
  },
  continueDisabled: { backgroundColor: '#B8C4D2' },
  continueText: { fontFamily: FONTS.BOLD, fontSize: 15, letterSpacing: 0.3, color: COLORS.SURFACE },
});