import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Svg, { Path, Rect } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import {
  ClipboardPulseIcon,
  HeartPulseIcon,
  IdCardIcon,
  MapPinIcon,
  StethoscopeIcon,
  UserIcon,
} from '../../components/icons';
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  ScanIcon,
  ShareIcon,
  ShieldCheckIcon,
  StarIcon,
  type BookingIconProps,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import { ApiRequestError } from '../../services/apiClient';
import {
  getDoctorProfile,
  type DoctorProfile,
  type StrengthIconKey,
} from '../../services/doctorProfileService';
import {
  getScheduleDays,
  getTimeSlots,
  type ScheduleDay,
  type ShiftId,
  type TimeSlot,
} from '../../services/scheduleService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type SvgIconProps = { size?: number; color?: string; fill?: string; strokeWidth?: number };

function SvgIcon({
  size = 20,
  color = COLORS.PRIMARY,
  fill = 'none',
  strokeWidth = 2,
  children,
}: SvgIconProps & { children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

const HeartIcon = (props: SvgIconProps) => (
  <SvgIcon {...props}>
    <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </SvgIcon>
);

const MessageIcon = (props: SvgIconProps) => (
  <SvgIcon {...props}>
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </SvgIcon>
);

const CalendarPlusIcon = (props: SvgIconProps) => (
  <SvgIcon {...props}>
    <Path d="M8 2v4M16 2v4M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M3 10h18M16 19h6M19 16v6" />
  </SvgIcon>
);

const SCREEN_PADDING = 16;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const SUCCESS_TEXT = '#1E9E6A';
const SUCCESS_BACKGROUND = '#E3F7EE';
const RATING_COLOR = '#F5A524';
const ICON_BOX_BACKGROUND = '#DCEBFA';
const BACKGROUND_GRADIENT = ['#E3EFFB', COLORS.BACKGROUND] as const;
const BOOK_GRADIENT = ['#3A80B2', '#0A5C8E'] as const;
const MS_PER_DAY = 86400000;

const STRENGTH_ICONS: Record<StrengthIconKey, ComponentType<BookingIconProps>> = {
  CORONARY: HeartPulseIcon,
  HYPERTENSION: ClipboardPulseIcon,
  HEART_FAILURE: HeartIcon,
  DOPPLER: ScanIcon,
  INTERVENTION: StethoscopeIcon,
};

const SESSION_LABELS: Record<ShiftId, string> = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
};

type SlotItem = {
  slot: TimeSlot;
  sessionLabel: string;
};

const pad = (value: number) => String(value).padStart(2, '0');
const formatNumber = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const showComingSoon = () => Alert.alert('Thông báo', 'Chức năng đang được phát triển');

const getWeekIndex = (year: number, month: number, day: number) =>
  Math.floor((Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY) + 3) / 7);

const getWeekOffset = (day: ScheduleDay) => {
  const now = new Date();
  return (
    getWeekIndex(day.year, day.month, day.day) -
    getWeekIndex(now.getFullYear(), now.getMonth() + 1, now.getDate())
  );
};

const getDayCaption = (day: ScheduleDay, index: number) => {
  if (index === 0) return 'Hôm nay';
  if (index === 1) return 'Ngày mai';
  const offset = getWeekOffset(day);
  if (offset <= 0) return 'Tuần này';
  if (offset === 1) return 'Tuần tới';
  return 'Tuần sau';
};

type DoctorDetailScreenProps = {
  doctorId: string;
  onPressBack?: () => void;
  onPressBook?: (selection: {
    doctorId: string;
    specialtyId: string;
    dateKey?: string;
    slotId?: string;
  }) => void;
  onPressChat?: () => void;
};

export default function DoctorDetailScreen({
  doctorId,
  onPressBack,
  onPressBook,
  onPressChat,
}: DoctorDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileRetry, setProfileRetry] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [dayLoadError, setDayLoadError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleRetry, setScheduleRetry] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    getDoctorProfile(doctorId, controller.signal)
      .then((profileData) => {
        if (!isActive) return;
        setProfile(profileData);
      })
      .catch((error: unknown) => {
        if (!isActive || controller.signal.aborted) return;
        if (error instanceof ApiRequestError && error.status === 404) {
          setLoadError('Không tìm thấy bác sĩ.');
        } else {
          setLoadError(
            error instanceof Error ? error.message : 'Không thể tải thông tin bác sĩ.',
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [doctorId, profileRetry]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    getScheduleDays({ doctorId }, controller.signal)
      .then((dayData) => {
        if (!isActive) return;
        setDayLoadError(null);
        setDays(dayData);
        const firstOpenDay = dayData.find((item) => !item.isFullyBooked);
        setSelectedDateKey(firstOpenDay ? firstOpenDay.dateKey : null);
      })
      .catch(() => {
        if (isActive && !controller.signal.aborted) {
          setDays([]);
          setDayLoadError('Không thể tải lịch khám.');
        }
      });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [doctorId, scheduleRetry]);

  useEffect(() => {
    setSelectedSlotId(null);
    if (!selectedDateKey) {
      setSlots([]);
      setScheduleError(null);
      return undefined;
    }
    let isActive = true;
    setScheduleError(null);
    const controller = new AbortController();
    getTimeSlots(doctorId, selectedDateKey, controller.signal).then((shifts) => {
      if (!isActive) return;
      const items = shifts.flatMap((shift) =>
        shift.slots
          .filter((slot) => slot.isAvailable)
          .map((slot) => ({ slot, sessionLabel: SESSION_LABELS[shift.id] })),
      );
      setSlots(items);
      setSelectedSlotId(items[0] ? items[0].slot.id : null);
    }).catch(() => {
      if (isActive && !controller.signal.aborted) {
        setSlots([]);
        setScheduleError('Không thể tải khung giờ trống.');
      }
    });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [doctorId, selectedDateKey, scheduleRetry]);

  const selectedDay = days.find((item) => item.dateKey === selectedDateKey) ?? days[0];
  const hasScheduleThisWeek = days.some((item) => !item.isFullyBooked && getWeekOffset(item) <= 0);
  const monthLabel = selectedDay ? `Tháng ${pad(selectedDay.month)}/${selectedDay.year}` : '';

  const renderDoctorCard = (doctor: DoctorProfile) => {
    const stats = [
      {
        id: 'rating',
        value: doctor.rating === null ? '—' : doctor.rating.toFixed(1),
        label: doctor.reviewCount === 0
          ? 'Chưa có đánh giá'
          : `${formatNumber(doctor.reviewCount)} đánh giá`,
        hasStar: true,
      },
      {
        id: 'experience',
        value: doctor.experienceYears === null
          ? 'Chưa cập nhật'
          : `${doctor.experienceYears}+ Năm`,
        label: 'Kinh nghiệm',
      },
      {
        id: 'cases',
        value: doctor.treatedCases === null
          ? 'Chưa cập nhật'
          : `${formatNumber(doctor.treatedCases)}+`,
        label: 'Ca điều trị',
      },
    ];
    return (
      <View style={styles.card}>
        <View style={styles.doctorTop}>
          <View>
            {doctor.photoUrl ? (
              <Image source={{ uri: doctor.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <UserIcon size={44} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.6} />
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <ShieldCheckIcon size={13} color={COLORS.SURFACE} />
            </View>
          </View>

          <View style={styles.flex}>
            <View
              style={[
                styles.availabilityChip,
                !hasScheduleThisWeek && styles.availabilityChipOff,
              ]}
            >
              <View
                style={[styles.availabilityDot, !hasScheduleThisWeek && styles.availabilityDotOff]}
              />
              <Text
                style={[styles.availabilityText, !hasScheduleThisWeek && styles.availabilityTextOff]}
              >
                {hasScheduleThisWeek ? 'Có lịch khám trong tuần' : 'Chưa có lịch trong tuần'}
              </Text>
            </View>
            <Text style={styles.doctorName}>{doctor.fullName.toUpperCase()}</Text>
            <Text style={styles.doctorTitle}>
              {[doctor.academicTitle, doctor.position].filter(Boolean).join(' - ') || 'Chưa cập nhật'}
            </Text>
            <View style={styles.hospitalRow}>
              <BuildingIcon size={14} color={COLORS.PRIMARY_LIGHT} />
              <Text style={styles.hospitalText} numberOfLines={1}>
                {doctor.hospitalName ?? 'Chưa cập nhật'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statBox}>
              <View style={styles.statValueRow}>
                {stat.hasStar && <StarIcon size={15} color={RATING_COLOR} />}
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderIntroduction = (doctor: DoctorProfile) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <IdCardIcon size={18} color={COLORS.PRIMARY_LIGHT} />
        </View>
        <Text style={styles.cardTitle}>Giới thiệu & Chuyên môn chính</Text>
      </View>
      <Text style={styles.introText}>
        {doctor.introduction ?? 'Chưa có thông tin giới thiệu.'}
      </Text>
      {doctor.strengths?.length ? (
        <>
          <Text style={styles.strengthLabel}>Lĩnh vực thế mạnh chuyên sâu:</Text>
          <View style={styles.tagWrap}>
            {doctor.strengths.map((strength) => {
              const Icon = STRENGTH_ICONS[strength.iconKey];
              return (
                <View key={strength.id} style={styles.tag}>
                  <Icon size={14} color={COLORS.PRIMARY_LIGHT} />
                  <Text style={styles.tagText}>{strength.label}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <CalendarIcon size={18} color={COLORS.PRIMARY_LIGHT} />
        </View>
        <Text style={styles.cardTitle}>Lịch khám sắp tới</Text>
        <View style={styles.flex} />
        <Text style={styles.monthText}>{monthLabel}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayRow}
        style={styles.dayScroll}
      >
        {days.map((day, index) => {
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
              onPress={() => setSelectedDateKey(day.dateKey)}
            >
              <Text style={[styles.dayCaption, isSelected && styles.dayTextOnSelected]}>
                {getDayCaption(day, index)}
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
              <Text style={[styles.dayWeekday, isSelected && styles.dayTextOnSelected]}>
                {day.weekdayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.slotHeader}>
        <Text style={styles.slotLabel}>Khung giờ còn trống:</Text>
        <View style={styles.countChip}>
          <CalendarIcon size={12} color={SUCCESS_TEXT} />
          <Text style={styles.countText}>{slots.length} ca khám trống</Text>
        </View>
      </View>

      {dayLoadError ? (
        <TouchableOpacity onPress={() => setScheduleRetry((value) => value + 1)}>
          <Text style={styles.emptyText}>{dayLoadError}</Text>
        </TouchableOpacity>
      ) : scheduleError ? (
        <TouchableOpacity onPress={() => setScheduleRetry((value) => value + 1)}>
          <Text style={styles.emptyText}>{scheduleError}</Text>
        </TouchableOpacity>
      ) : slots.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có khung giờ trống trong ngày này.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotRow}
          style={styles.dayScroll}
        >
          {slots.map(({ slot, sessionLabel }) => {
            const isSelected = slot.id === selectedSlotId;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!profile || !selectedDateKey) return;
                  setSelectedSlotId(slot.id);
                  onPressBook?.({
                    doctorId: profile.id,
                    specialtyId: profile.specialtyId,
                    dateKey: selectedDateKey,
                    slotId: slot.id,
                  });
                }}
              >
                <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                  {slot.startTime} - {slot.endTime}
                </Text>
                <Text style={styles.slotSession}>{sessionLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderLocation = (doctor: DoctorProfile) => (
    <View style={styles.locationCard}>
      <View style={styles.locationIcon}>
        <MapPinIcon size={20} color={COLORS.PRIMARY_LIGHT} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.locationTitle}>{doctor.clinicName ?? 'Chưa cập nhật phòng khám'}</Text>
        <Text style={styles.locationAddress}>{doctor.clinicAddress ?? 'Chưa cập nhật địa chỉ'}</Text>
      </View>
    </View>
  );

  const renderBody = () => {
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
          <TouchableOpacity onPress={() => setProfileRetry((value) => value + 1)}>
            <Text style={styles.emptyText}>
              {loadError ?? 'Không tìm thấy thông tin bác sĩ.'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderDoctorCard(profile)}
        {renderIntroduction(profile)}
        {renderSchedule()}
        {renderLocation(profile)}
      </ScrollView>
    );
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} locations={[0, 0.35]} style={styles.flex}>
      <ScreenContainer style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity hitSlop={10} onPress={onPressBack}>
            <ArrowLeftIcon size={24} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin Bác sĩ</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity hitSlop={10} onPress={() => setIsFavorite(!isFavorite)}>
              <HeartIcon
                size={22}
                color={isFavorite ? '#E5484D' : COLORS.PRIMARY_LIGHT}
                fill={isFavorite ? '#E5484D' : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
              <ShareIcon size={22} color={COLORS.PRIMARY_LIGHT} />
            </TouchableOpacity>
          </View>
        </View>

        {renderBody()}

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.85}
            onPress={onPressChat ?? showComingSoon}
          >
            <MessageIcon size={22} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.flex}
            activeOpacity={0.85}
            onPress={() => {
              if (!profile) return;
              onPressBook?.({
                doctorId: profile.id,
                specialtyId: profile.specialtyId,
                dateKey: selectedDateKey ?? undefined,
                slotId: selectedSlotId ?? undefined,
              });
            }}
          >
            <LinearGradient
              colors={BOOK_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButton}
            >
              <CalendarPlusIcon size={20} color={COLORS.SURFACE} />
              <Text style={styles.bookText}>ĐẶT LỊCH VỚI BÁC SĨ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingBottom: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyText: { fontFamily: FONTS.REGULAR, fontSize: 13, color: MUTED_TEXT },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 10,
  },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 18, color: NAVY },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8, paddingBottom: 20, gap: 14 },
  card: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  doctorTop: { flexDirection: 'row', gap: 14 },
  photo: { width: 104, height: 128, borderRadius: 16 },
  photoPlaceholder: {
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  availabilityChipOff: { backgroundColor: '#EEF2F7' },
  availabilityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS_TEXT },
  availabilityDotOff: { backgroundColor: MUTED_TEXT },
  availabilityText: { fontFamily: FONTS.BOLD, fontSize: 11, color: SUCCESS_TEXT },
  availabilityTextOff: { color: COLORS.TEXT_MUTED },
  doctorName: { marginTop: 8, fontFamily: FONTS.BOLD, fontSize: 20, lineHeight: 26, color: NAVY },
  doctorTitle: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.TEXT_MUTED,
  },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  hospitalText: { flex: 1, fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.PRIMARY },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EEF4FB',
  },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontFamily: FONTS.BOLD, fontSize: 16, color: NAVY },
  statLabel: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: ICON_BOX_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONTS.BOLD, fontSize: 16, color: NAVY },
  introText: { fontFamily: FONTS.REGULAR, fontSize: 13, lineHeight: 21, color: COLORS.TEXT_MUTED },
  strengthLabel: {
    marginTop: 14,
    marginBottom: 10,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    color: MUTED_TEXT,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#B9D6F0',
    backgroundColor: '#F1F7FD',
  },
  tagText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.PRIMARY },
  monthText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  dayScroll: { flexGrow: 0, marginHorizontal: -16 },
  dayRow: { gap: 8, paddingHorizontal: 16 },
  dayCard: {
    width: 74,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  dayCardSelected: { borderColor: COLORS.PRIMARY_LIGHT, backgroundColor: COLORS.PRIMARY_LIGHT },
  dayCardDisabled: { backgroundColor: '#F3F5F8' },
  dayCaption: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: COLORS.TEXT_MUTED },
  dayNumber: { marginTop: 4, fontFamily: FONTS.BOLD, fontSize: 22, color: NAVY },
  dayNumberDisabled: { color: MUTED_TEXT, textDecorationLine: 'line-through' },
  dayWeekday: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  dayTextOnSelected: { color: COLORS.SURFACE },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  slotLabel: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  countText: { fontFamily: FONTS.BOLD, fontSize: 11, color: SUCCESS_TEXT },
  slotRow: { gap: 8, paddingHorizontal: 16 },
  slotCard: {
    width: 112,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  slotCardSelected: { borderColor: COLORS.PRIMARY_LIGHT, backgroundColor: '#E6F0FA' },
  slotTime: { fontFamily: FONTS.BOLD, fontSize: 13, color: NAVY },
  slotTimeSelected: { color: COLORS.PRIMARY },
  slotSession: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EAF2FB',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  locationAddress: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.TEXT_MUTED,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
  },
  bookText: { fontFamily: FONTS.BOLD, fontSize: 15, letterSpacing: 0.3, color: COLORS.SURFACE },
});