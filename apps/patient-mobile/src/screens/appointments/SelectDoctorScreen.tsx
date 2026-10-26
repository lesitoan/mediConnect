import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BookingStepper from '../../components/BookingStepper';
import ScreenContainer from '../../components/ScreenContainer';
import ScreenHeader from '../../components/ScreenHeader';
import { UserIcon } from '../../components/icons';
import {
  CalendarClockIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MedicalSquareIcon,
  ShieldCheckIcon,
  SPECIALTY_ICONS,
  StarIcon,
  UsersIcon,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import type { Profile } from '../../services/profileService';
import {
  getAvailableDoctors,
  getScheduleDays,
  type Doctor,
  type ScheduleDay,
} from '../../services/scheduleService';
import type { Specialty, SpecialtyService } from '../../services/specialtyService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const BOOKING_STEPS = ['Hồ sơ', 'Khoa khám', 'Bác sĩ & Giờ', 'Xác nhận'];
const CURRENT_STEP_INDEX = 2;
const SCREEN_PADDING = 16;
const DAY_CARD_WIDTH = 72;
const FOOTER_GRADIENT = ['#17709A', '#0B3E63'] as const;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const DANGER_TEXT = '#E5484D';
const RATING_COLOR = '#F5A524';
const CARD_BUTTON_COLOR = '#5AB3E3';

const pad = (value: number) => String(value).padStart(2, '0');
const formatDate = (day: ScheduleDay) => `${pad(day.day)}/${pad(day.month)}/${day.year}`;
const formatFee = (value: number) => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

export type DoctorSelection = {
  day: ScheduleDay;
  doctor: Doctor;
};

type SelectDoctorScreenProps = {
  profile: Profile;
  specialty: Specialty;
  service: SpecialtyService;
  onPressBack?: () => void;
  onPressHome?: () => void;
  onContinue?: (selection: DoctorSelection) => void;
};

export default function SelectDoctorScreen({
  profile,
  service,
  onPressBack,
  onPressHome,
  onContinue,
}: SelectDoctorScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const hasPendingScrollRef = useRef(false);

  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState(true);
  const [isDaysExpanded, setIsDaysExpanded] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    getScheduleDays(service.id)
      .then((data) => {
        if (isActive) setDays(data);
      })
      .finally(() => {
        if (isActive) setIsLoadingDays(false);
      });
    return () => {
      isActive = false;
    };
  }, [service.id]);

  useEffect(() => {
    if (!selectedDateKey) {
      setDoctors([]);
      return undefined;
    }
    let isActive = true;
    setIsLoadingDoctors(true);
    getAvailableDoctors(service.id, selectedDateKey)
      .then((data) => {
        if (isActive) setDoctors(data);
      })
      .finally(() => {
        if (isActive) setIsLoadingDoctors(false);
      });
    return () => {
      isActive = false;
    };
  }, [service.id, selectedDateKey]);

  const selectedDay = days.find((item) => item.dateKey === selectedDateKey);
  const selectedDoctor = doctors.find((item) => item.id === selectedDoctorId);
  const canContinue = !!selectedDay && !!selectedDoctor;
  const ServiceIcon = SPECIALTY_ICONS[service.iconKey];

  const handleSelectDay = (day: ScheduleDay) => {
    if (day.isFullyBooked) return;
    hasPendingScrollRef.current = true;
    setSelectedDateKey(day.dateKey);
    setSelectedDoctorId(null);
  };

  const handleDoctorsLayout = (event: LayoutChangeEvent) => {
    if (!hasPendingScrollRef.current) return;
    hasPendingScrollRef.current = false;
    scrollRef.current?.scrollTo({ y: event.nativeEvent.layout.y - 12, animated: true });
  };

  const handleContinue = () => {
    if (selectedDay && selectedDoctor) onContinue?.({ day: selectedDay, doctor: selectedDoctor });
  };

  const renderDayCard = (day: ScheduleDay) => {
    const isSelected = day.dateKey === selectedDateKey;
    return (
      <TouchableOpacity
        key={day.dateKey}
        style={[
          styles.dayCard,
          isSelected && styles.dayCardSelected,
          day.isFullyBooked && styles.dayCardDisabled,
        ]}
        activeOpacity={0.85}
        disabled={day.isFullyBooked}
        onPress={() => handleSelectDay(day)}
      >
        {isSelected && <View style={styles.dayDot} />}
        <Text style={[styles.dayWeekday, isSelected && styles.dayTextOnSelected]}>
          {day.weekdayLabel}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            isSelected && styles.dayTextOnSelected,
            day.isFullyBooked && styles.dayNumberDisabled,
          ]}
        >
          {day.day}
        </Text>
        {isSelected ? (
          <View style={styles.dayCheck}>
            <CheckIcon size={12} color={COLORS.SURFACE} strokeWidth={3} />
          </View>
        ) : day.isFullyBooked ? (
          <Text style={styles.dayFull}>Đã kín</Text>
        ) : (
          <Text style={styles.dayCount}>{day.availableDoctorCount} Bác sĩ</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderDoctorCard = (doctor: Doctor) => {
    const isSelected = doctor.id === selectedDoctorId;
    return (
      <View key={doctor.id} style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}>
        {doctor.photoUrl ? (
          <Image source={{ uri: doctor.photoUrl }} style={styles.doctorPhoto} />
        ) : (
          <View style={[styles.doctorPhoto, styles.doctorPhotoPlaceholder]}>
            <UserIcon size={36} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.6} />
          </View>
        )}

        <View style={styles.flex}>
          <View style={styles.doctorNameRow}>
            <Text style={styles.doctorName}>{doctor.fullName.toUpperCase()}</Text>
            <View style={styles.ratingRow}>
              <StarIcon size={13} color={RATING_COLOR} />
              <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.doctorInfo}>
            Học hàm học vị: <Text style={styles.doctorInfoValue}>{doctor.academicTitle}</Text>
          </Text>
          <Text style={styles.doctorInfo}>
            Kinh nghiệm: <Text style={styles.doctorInfoValue}>{doctor.experience}</Text>
          </Text>
          <Text style={styles.doctorInfo}>
            Chức vụ: <Text style={styles.doctorInfoValue}>{doctor.position}</Text>
          </Text>

          <TouchableOpacity
            style={[styles.pickButton, isSelected && styles.pickButtonSelected]}
            activeOpacity={0.85}
            onPress={() => setSelectedDoctorId(doctor.id)}
          >
            <Text style={styles.pickButtonText}>{isSelected ? 'ĐÃ CHỌN' : 'CHỌN GIỜ KHÁM'}</Text>
            {isSelected ? (
              <CheckIcon size={14} color={COLORS.SURFACE} strokeWidth={3} />
            ) : (
              <CalendarClockIcon size={14} color={COLORS.SURFACE} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDoctors = () => {
    if (!selectedDay) {
      return (
        <View style={styles.hintCard}>
          <CalendarIcon size={22} color={COLORS.PRIMARY_LIGHT} />
          <Text style={styles.hintText}>Chọn ngày khám để xem các bác sĩ còn lịch trong ngày.</Text>
        </View>
      );
    }

    return (
      <View key={selectedDay.dateKey} onLayout={handleDoctorsLayout}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <UsersIcon size={20} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>2. Chọn bác sĩ</Text>
          </View>
          <Text style={styles.sortText}>Sắp xếp: Phù hợp nhất</Text>
        </View>

        {isLoadingDoctors ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
          </View>
        ) : doctors.length === 0 ? (
          <Text style={styles.emptyText}>Không có bác sĩ còn lịch trong ngày này.</Text>
        ) : (
          <>
            {doctors.map(renderDoctorCard)}
            <View style={styles.noteCard}>
              <ShieldCheckIcon size={18} color={COLORS.PRIMARY_LIGHT} />
              <Text style={styles.noteText}>
                Bệnh nhân được đặt số thứ tự khám ưu tiên, miễn phí hủy hoặc đổi lịch khám trước 02 giờ.
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Đặt khám" onPressBack={onPressBack} onPressHome={onPressHome} />
      <BookingStepper steps={BOOKING_STEPS} currentIndex={CURRENT_STEP_INDEX} hasCard />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contextBar}>
          <ServiceIcon size={16} color={COLORS.PRIMARY_LIGHT} />
          <Text style={styles.contextLabel} numberOfLines={1}>
            Chuyên khoa: <Text style={styles.contextValue}>{service.name}</Text>
          </Text>
          <View style={styles.contextDivider} />
          <UserIcon size={14} color={COLORS.PRIMARY_LIGHT} />
          <Text style={styles.contextProfile} numberOfLines={1}>
            {profile.fullName.toUpperCase()}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <CalendarIcon size={22} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>1. Chọn ngày khám</Text>
          </View>
          <TouchableOpacity onPress={() => setIsDaysExpanded(!isDaysExpanded)}>
            <Text style={styles.sectionLink}>{isDaysExpanded ? 'Thu gọn' : 'Xem tất cả >'}</Text>
          </TouchableOpacity>
        </View>

        {isLoadingDays ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
          </View>
        ) : isDaysExpanded ? (
          <View style={styles.dayGrid}>{days.map(renderDayCard)}</View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
            style={styles.dayScroll}
          >
            {days.map(renderDayCard)}
          </ScrollView>
        )}

        {renderDoctors()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <MedicalSquareIcon size={20} color={COLORS.PRIMARY_LIGHT} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.summaryDoctor} numberOfLines={1}>
              {selectedDoctor ? selectedDoctor.fullName : 'Chưa chọn bác sĩ'}
            </Text>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              {selectedDay ? `${selectedDay.weekdayLabel}, ${formatDate(selectedDay)}` : 'Chưa chọn ngày'}
              {'  •  '}
              Chưa chọn giờ khám
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryPrice}>
            <Text style={styles.priceLabel}>TẠM TÍNH</Text>
            <Text style={styles.priceValue}>{formatFee(service.minFee)}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.85} disabled={!canContinue} onPress={handleContinue}>
          {canContinue ? (
            <LinearGradient
              colors={FOOTER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>CHỌN GIỜ KHÁM VỚI BÁC SĨ</Text>
              <ClockIcon size={18} color={COLORS.SURFACE} />
            </LinearGradient>
          ) : (
            <View style={[styles.continueButton, styles.continueDisabled]}>
              <Text style={styles.continueText}>CHỌN GIỜ KHÁM VỚI BÁC SĨ</Text>
              <ClockIcon size={18} color={COLORS.SURFACE} />
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
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EAF2FB',
  },
  contextLabel: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  contextValue: { fontFamily: FONTS.BOLD, color: COLORS.TEXT },
  contextDivider: { width: 1, height: 16, backgroundColor: COLORS.BORDER },
  contextProfile: {
    flexShrink: 1,
    maxWidth: '38%',
    fontFamily: FONTS.BOLD,
    fontSize: 12,
    color: COLORS.PRIMARY_LIGHT,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 17, color: COLORS.PRIMARY },
  sectionLink: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  sortText: { fontFamily: FONTS.REGULAR, fontSize: 11, color: MUTED_TEXT },
  loadingBox: { height: 96, alignItems: 'center', justifyContent: 'center' },
  dayScroll: { flexGrow: 0, marginHorizontal: -SCREEN_PADDING },
  dayRow: { gap: 8, paddingHorizontal: SCREEN_PADDING },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCard: {
    width: DAY_CARD_WIDTH,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  dayCardSelected: { borderColor: COLORS.PRIMARY_LIGHT, backgroundColor: COLORS.PRIMARY_LIGHT },
  dayCardDisabled: { backgroundColor: '#F3F5F8' },
  dayDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8FD0F5',
  },
  dayWeekday: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: COLORS.TEXT_MUTED },
  dayNumber: { marginTop: 4, fontFamily: FONTS.BOLD, fontSize: 22, color: COLORS.TEXT },
  dayNumberDisabled: { color: MUTED_TEXT, textDecorationLine: 'line-through' },
  dayTextOnSelected: { color: COLORS.SURFACE },
  dayCount: { marginTop: 6, fontFamily: FONTS.SEMI_BOLD, fontSize: 10, color: COLORS.PRIMARY_LIGHT },
  dayFull: { marginTop: 6, fontFamily: FONTS.SEMI_BOLD, fontSize: 10, color: DANGER_TEXT },
  dayCheck: {
    width: 22,
    height: 22,
    marginTop: 6,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BFD3E8',
    backgroundColor: '#F1F6FC',
  },
  hintText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 12, lineHeight: 18, color: COLORS.TEXT_MUTED },
  emptyText: { textAlign: 'center', fontFamily: FONTS.REGULAR, fontSize: 13, color: MUTED_TEXT },
  doctorCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  doctorCardSelected: { borderColor: NAVY },
  doctorPhoto: { width: 88, height: 112, borderRadius: 12 },
  doctorPhotoPlaceholder: {
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  doctorName: { flex: 1, fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 19, color: COLORS.PRIMARY },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: FONTS.BOLD, fontSize: 12, color: RATING_COLOR },
  doctorInfo: { fontFamily: FONTS.REGULAR, fontSize: 11, lineHeight: 17, color: MUTED_TEXT },
  doctorInfoValue: { fontFamily: FONTS.SEMI_BOLD, color: COLORS.TEXT },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    height: 30,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: CARD_BUTTON_COLOR,
  },
  pickButtonSelected: { backgroundColor: NAVY },
  pickButtonText: { fontFamily: FONTS.BOLD, fontSize: 11, color: COLORS.SURFACE },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EAF2FB',
  },
  noteText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 11, lineHeight: 16, color: COLORS.TEXT_MUTED },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EAF2FB',
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDoctor: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },
  summaryMeta: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 10, color: COLORS.PRIMARY_LIGHT },
  summaryDivider: { width: 1, height: 30, backgroundColor: COLORS.BORDER },
  summaryPrice: { alignItems: 'flex-end' },
  priceLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 9, color: MUTED_TEXT },
  priceValue: { marginTop: 2, fontFamily: FONTS.BOLD, fontSize: 16, color: NAVY },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
  },
  continueDisabled: { backgroundColor: '#B8C4D2' },
  continueText: { fontFamily: FONTS.BOLD, fontSize: 14, letterSpacing: 0.3, color: COLORS.SURFACE },
});