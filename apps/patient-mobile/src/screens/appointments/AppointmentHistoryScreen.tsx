import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  BriefcaseMedicalIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  HelpCircleIcon,
  HistoryIcon,
  MapPinIcon,
  NewspaperIcon,
  PlusCircleIcon,
  QrCodeIcon,
  SearchIcon,
  SlidersIcon,
  StarIcon,
  UserIcon,
  XCircleIcon,
} from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  getAppointments,
  type Appointment,
  type AppointmentStatus,
} from '../../services/appointmentService';
import { getProfiles, type Profile } from '../../services/profileService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const BUTTON_GRADIENT = ['#3A80B2', '#005B8D'] as const;
const RATING_COLOR = '#F5A524';

type TabKey = 'upcoming' | 'completed' | 'cancelled';

const TABS: { key: TabKey; label: string; statuses: AppointmentStatus[] }[] = [
  { key: 'upcoming', label: 'Sắp tới', statuses: ['confirmed', 'pending'] },
  { key: 'completed', label: 'Đã khám', statuses: ['completed'] },
  { key: 'cancelled', label: 'Đã hủy', statuses: ['cancelled'] },
];

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; background: string; color: string; dot: string }
> = {
  confirmed: {
    label: 'ĐÃ XÁC NHẬN • SẮP DIỄN RA',
    background: '#E3F6EA',
    color: '#1E8E4E',
    dot: '#2BB673',
  },
  pending: { label: 'CHỜ XÁC NHẬN', background: '#FFF3D6', color: '#B7791F', dot: '#F5A524' },
  completed: { label: 'ĐÃ KHÁM', background: '#E6F0FB', color: '#2D74A8', dot: '#2D74A8' },
  cancelled: { label: 'ĐÃ HỦY', background: '#FDE8E8', color: '#BA1A1A', dot: '#E5484D' },
};

const formatFee = (amount: number) =>
  `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;

const showComingSoon = () => Alert.alert('Thông báo', 'Chức năng đang được phát triển');

type AppointmentCardProps = {
  appointment: Appointment;
  onPressReschedule?: (appointment: Appointment) => void; 
  onPressCancel?: (appointment: Appointment) => void;
};

function StatusRow({ appointment }: AppointmentCardProps) {
  const meta = STATUS_META[appointment.status];

  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusBadge, { backgroundColor: meta.background }]}>
        <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
        <Text style={[styles.statusText, { color: meta.color }]} numberOfLines={1}>
          {meta.label}
        </Text>
      </View>
      <View style={styles.codeBadge}>
        <Text style={styles.codeText} numberOfLines={1}>
          #{appointment.code}
        </Text>
      </View>
    </View>
  );
}

function DetailedCard({ appointment, onPressReschedule, onPressCancel }: AppointmentCardProps) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={BUTTON_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />
      <StatusRow appointment={appointment} />

      <View style={styles.banner}>
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
            style={[StyleSheet.absoluteFill, styles.bannerPlaceholder]}
          >
            <UserIcon size={44} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.5} />
          </LinearGradient>
        )}
        {appointment.rating !== undefined && (
          <View style={styles.ratingPill}>
            <StarIcon size={11} color={RATING_COLOR} fill={RATING_COLOR} strokeWidth={1} />
            <Text style={styles.ratingText}>{appointment.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.doctorLabelRow}>
        <BadgeCheckIcon size={13} color={COLORS.PRIMARY_LIGHT} />
        <Text style={styles.smallCaps}>BÁC SĨ PHỤ TRÁCH</Text>
      </View>
      <Text style={styles.doctorName}>{appointment.doctorName}</Text>
      <Text style={styles.doctorSpecialty}>
        {appointment.specialty} • {appointment.expertise}
      </Text>

      <View style={styles.infoBox}>
        <View style={styles.infoIcon}>
          <CalendarIcon size={18} color={COLORS.PRIMARY_LIGHT} />
        </View>
        <View style={styles.infoTextBlock}>
          <Text style={styles.smallCaps}>THỜI GIAN HẸN</Text>
          <Text style={styles.infoValue}>
            {appointment.time} • {appointment.weekday}
          </Text>
          <Text style={styles.infoSub}>{appointment.date}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoIcon}>
          <MapPinIcon size={18} color={COLORS.PRIMARY_LIGHT} />
        </View>
        <View style={styles.infoTextBlock}>
          <Text style={styles.smallCaps}>ĐỊA ĐIỂM KHÁM</Text>
          <Text style={styles.infoValue}>
            {appointment.room}, {appointment.building}
          </Text>
        </View>
      </View>

      {appointment.advanceFee !== undefined && (
        <View style={styles.feeRow}>
          <CheckCircleIcon size={16} color="#2BB673" />
          <Text style={styles.feeLabel}>Chi phí tạm ứng:</Text>
          <Text style={styles.feeValue}>{formatFee(appointment.advanceFee)}</Text>
        </View>
      )}

      {/* SỬA LẠI: Nút Xem vé khám trả về showComingSoon */}
      <TouchableOpacity style={styles.ticketButton} activeOpacity={0.85} onPress={showComingSoon}>
        <LinearGradient
          colors={BUTTON_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ticketButtonInner}
        >
          <QrCodeIcon size={18} color={COLORS.SURFACE} />
          <Text style={styles.ticketButtonText}>Xem vé khám</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rescheduleButton]}
          activeOpacity={0.85}
          onPress={() => (onPressReschedule ? onPressReschedule(appointment) : showComingSoon())}
        >
          <CalendarClockIcon size={16} color={COLORS.PRIMARY_LIGHT} />
          <Text style={[styles.actionText, { color: COLORS.PRIMARY_LIGHT }]}>Đổi lịch khám</Text>
        </TouchableOpacity>
        
        {/* SỬA LẠI: Nút Hủy lịch hẹn gọi onPressCancel */}
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelFilledButton]}
          activeOpacity={0.85}
          onPress={() => (onPressCancel ? onPressCancel(appointment) : showComingSoon())}
        >
          <XCircleIcon size={16} color={COLORS.DANGER} />
          <Text style={[styles.actionText, { color: COLORS.DANGER }]}>Hủy lịch hẹn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// SỬA LẠI: Thêm onPressCancel vào props
function CompactCard({ appointment, onPressReschedule, onPressCancel }: AppointmentCardProps) { 
  return (
    <View style={styles.card}>
      <StatusRow appointment={appointment} />

      <Text style={[styles.smallCaps, styles.compactSpecialty]}>
        {appointment.specialty.toUpperCase()}
      </Text>
      <View style={styles.compactDoctorRow}>
        <View style={styles.compactDoctorIcon}>
          <BriefcaseMedicalIcon size={22} color={COLORS.PRIMARY_LIGHT} />
        </View>
        <View style={styles.compactDoctorText}>
          <Text style={styles.compactDoctorName} numberOfLines={1}>
            {appointment.doctorName}
          </Text>
          <Text style={styles.compactDoctorExpertise} numberOfLines={1}>
            {appointment.expertise}
          </Text>
        </View>
      </View>

      <View style={styles.compactInfo}>
        <View style={styles.compactInfoCol}>
          <View style={styles.compactInfoHead}>
            <ClockIcon size={14} color={COLORS.PRIMARY_LIGHT} />
            <Text style={styles.compactInfoLabel}>Giờ hẹn</Text>
          </View>
          <Text style={styles.compactInfoValue}>
            {appointment.time} • {appointment.weekday}
          </Text>
          <Text style={styles.infoSub}>{appointment.date}</Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactInfoCol}>
          <View style={styles.compactInfoHead}>
            <MapPinIcon size={14} color={COLORS.PRIMARY_LIGHT} />
            <Text style={styles.compactInfoLabel}>Phòng khám</Text>
          </View>
          <Text style={styles.compactInfoValue}>{appointment.room}</Text>
          <Text style={styles.infoSub}>{appointment.building}</Text>
        </View>
      </View>

      {appointment.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            activeOpacity={0.85}
            onPress={() => (onPressReschedule ? onPressReschedule(appointment) : showComingSoon())}
          >
            <CalendarClockIcon size={16} color={COLORS.PRIMARY_LIGHT} />
            <Text style={[styles.actionText, { color: COLORS.PRIMARY_LIGHT }]}>Đổi lịch khám</Text>
          </TouchableOpacity>
          
          {/* SỬA LẠI: Nút Hủy lịch hẹn gọi onPressCancel */}
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelOutlineButton]}
            activeOpacity={0.85}
            onPress={() => (onPressCancel ? onPressCancel(appointment) : showComingSoon())}
          >
            <XCircleIcon size={16} color={COLORS.DANGER} />
            <Text style={[styles.actionText, { color: COLORS.DANGER }]}>Hủy lịch hẹn</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type AppointmentHistoryScreenProps = {
  onPressBack?: () => void;
  onPressNewBooking?: () => void;
  onPressReschedule?: (appointment: Appointment) => void; 
  onPressCancel?: (appointment: Appointment) => void;
};

export default function AppointmentHistoryScreen({
  onPressBack,
  onPressNewBooking,
  onPressReschedule,
  onPressCancel, 
}: AppointmentHistoryScreenProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      (async () => {
        try {
          const profiles = await getProfiles();
          const current = profiles.find((item) => item.isSelf) ?? profiles[0] ?? null;
          const items = current ? await getAppointments(current.id) : [];
          if (isActive) {
            setProfile(current);
            setAppointments(items);
          }
        } finally {
          if (isActive) setIsLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const counts = useMemo(
    () =>
      TABS.reduce<Record<TabKey, number>>(
        (result, tab) => ({
          ...result,
          [tab.key]: appointments.filter((item) => tab.statuses.includes(item.status)).length,
        }),
        { upcoming: 0, completed: 0, cancelled: 0 },
      ),
    [appointments],
  );

  const visibleAppointments = useMemo(() => {
    const tab = TABS.find((item) => item.key === activeTab) ?? TABS[0];
    const keyword = query.trim().toLowerCase();
    return appointments.filter(
      (item) =>
        tab.statuses.includes(item.status) &&
        (!keyword ||
          [item.doctorName, item.specialty, item.code].some((value) =>
            value.toLowerCase().includes(keyword),
          )),
    );
  }, [appointments, activeTab, query]);

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={onPressBack} hitSlop={10}>
          <ArrowLeftIcon size={24} color={COLORS.PRIMARY_LIGHT} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Quản lý lịch khám
          </Text>
          {profile && (
            <View style={styles.headerSubRow}>
              <UserIcon size={11} color={COLORS.PRIMARY_LIGHT} />
              <Text style={styles.headerSub} numberOfLines={1}>
                Hồ sơ: {profile.fullName.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
          <HistoryIcon size={22} color={COLORS.PRIMARY_LIGHT} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
          <HelpCircleIcon size={22} color={COLORS.PRIMARY_LIGHT} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <SearchIcon size={18} color={COLORS.ICON_MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm bác sĩ, chuyên khoa hoặc mã"
          placeholderTextColor={COLORS.PLACEHOLDER}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          allowFontScaling={false}
        />
        <SlidersIcon size={18} color={COLORS.ICON_MUTED} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                  {counts[tab.key]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {visibleAppointments.length === 0 ? (
            <Text style={styles.emptyText}>Không có lịch khám nào</Text>
          ) : (
            visibleAppointments.map((item) =>
              item.status === 'confirmed' ? (
                <DetailedCard
                  key={item.id}
                  appointment={item}
                  onPressReschedule={onPressReschedule}
                  onPressCancel={onPressCancel} 
                />
              ) : (
                <CompactCard
                  key={item.id}
                  appointment={item}
                  onPressReschedule={onPressReschedule} 
                  onPressCancel={onPressCancel} 
                />
              ),
            )
          )}

          {activeTab === 'upcoming' && (
            <View style={styles.policyBox}>
              <View style={styles.policyIcon}>
                <NewspaperIcon size={18} color={COLORS.PRIMARY_LIGHT} />
              </View>
              <View style={styles.policyTextBlock}>
                <Text style={styles.policyTitle}>Chính sách tiện ích MediConnect</Text>
                <Text style={styles.policyBody}>
                  Quý khách được <Text style={styles.policyBold}>Miễn phí Đổi lịch</Text> hoặc{' '}
                  <Text style={styles.policyBold}>Hủy lịch hoàn tiền 100%</Text> trước giờ hẹn 02
                  tiếng. Cần hỗ trợ khẩn cấp?{' '}
                  <Text style={styles.policyBold}>Hotline 1900 1234</Text>
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.newBookingButton}
            activeOpacity={0.85}
            onPress={onPressNewBooking}
          >
            <PlusCircleIcon size={20} color={COLORS.PRIMARY_LIGHT} />
            <Text style={styles.newBookingText}>Đặt thêm lịch khám mới</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.BACKGROUND },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  headerBack: { marginRight: -4 },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 17, lineHeight: 22, color: COLORS.TEXT },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerSub: { flex: 1, fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: COLORS.PRIMARY_LIGHT },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  searchInput: { flex: 1, height: 44, fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT },
  tabScroll: { flexGrow: 0, marginTop: 8, marginBottom: 8, overflow: 'visible' },
  tabRow: { gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: COLORS.PRIMARY_TINT,
  },
  tabActive: { backgroundColor: COLORS.PRIMARY_LIGHT },
  tabText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.TEXT_MUTED },
  tabTextActive: { color: COLORS.SURFACE },
  tabCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#DCE6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountActive: { backgroundColor: COLORS.SURFACE },
  tabCountText: { fontFamily: FONTS.BOLD, fontSize: 11, color: COLORS.TEXT_MUTED },
  tabCountTextActive: { color: COLORS.PRIMARY_LIGHT },
  listContent: { gap: 14, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28 },
  emptyText: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
  },
  card: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  accentBar: {
    height: 5,
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusBadge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { flexShrink: 1, fontFamily: FONTS.BOLD, fontSize: 10, letterSpacing: 0.2 },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: '#E9EEF6',
  },
  codeText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 10, color: '#6B7A90' },
  banner: {
    height: 128,
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  ratingPill: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  ratingText: { fontFamily: FONTS.BOLD, fontSize: 11, color: COLORS.TEXT },
  doctorLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 },
  smallCaps: { fontFamily: FONTS.SEMI_BOLD, fontSize: 10, letterSpacing: 0.4, color: COLORS.ICON_MUTED },
  doctorName: { marginTop: 4, fontFamily: FONTS.BOLD, fontSize: 18, lineHeight: 24, color: COLORS.TEXT },
  doctorSpecialty: {
    marginTop: 2,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.PRIMARY_LIGHT,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F4F7FB',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: { flex: 1 },
  infoValue: { marginTop: 2, fontFamily: FONTS.BOLD, fontSize: 15, lineHeight: 20, color: COLORS.TEXT },
  infoSub: { fontFamily: FONTS.REGULAR, fontSize: 11, lineHeight: 16, color: COLORS.TEXT_MUTED },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY_TINT,
  },
  feeLabel: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  feeValue: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.PRIMARY_LIGHT },
  ticketButton: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  ticketButtonText: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.SURFACE },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  rescheduleButton: { backgroundColor: '#E6F0FB', borderColor: '#CFE2F6' },
  cancelFilledButton: { backgroundColor: '#FDECEC', borderColor: '#F8D4D4' },
  cancelOutlineButton: { backgroundColor: COLORS.SURFACE, borderColor: '#F0B8B8' },
  actionText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13 },
  compactSpecialty: { marginTop: 14 },
  compactDoctorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  compactDoctorIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDoctorText: { flex: 1 },
  compactDoctorName: { fontFamily: FONTS.BOLD, fontSize: 16, lineHeight: 22, color: COLORS.TEXT },
  compactDoctorExpertise: { fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  compactInfo: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#F8FAFD',
  },
  compactInfoCol: { flex: 1 },
  compactInfoHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  compactInfoLabel: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  compactInfoValue: {
    marginTop: 4,
    fontFamily: FONTS.BOLD,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.TEXT,
  },
  compactDivider: { width: 1, marginHorizontal: 12, backgroundColor: COLORS.BORDER },
  policyBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: '#E8F2FC',
  },
  policyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#CFE4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyTextBlock: { flex: 1 },
  policyTitle: { fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 20, color: COLORS.PRIMARY_LIGHT },
  policyBody: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.TEXT_MUTED,
  },
  policyBold: { fontFamily: FONTS.BOLD, color: COLORS.TEXT },
  newBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#9CC0E4',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  newBookingText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: COLORS.PRIMARY_LIGHT },
});