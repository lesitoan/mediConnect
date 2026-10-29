import { useEffect, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ScreenContainer';
import { UserIcon } from '../../components/icons';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BookUserIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClinicCardIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FlaskIcon,
  HelpCircleIcon,
  PillIcon,
  QrCodeIcon,
  ScanIcon,
  SearchIcon,
  ShareIcon,
  ShieldCheckIcon,
  SyringeIcon,
  type BookingIconProps,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  getHealthRecordOverview,
  type HealthRecordOverview,
  type RecordCategory,
  type RecordCategoryId,
  type RecordTone,
} from '../../services/healthRecordService';
import { getProfiles, type Profile } from '../../services/profileService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const SCREEN_PADDING = 16;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const VERIFIED_GREEN = '#2EAD6B';
const ICON_BOX_BACKGROUND = '#DCEBFA';
const DANGER_TEXT = '#D64545';
const DANGER_BACKGROUND = '#FDE8E8';
const BACKGROUND_GRADIENT = ['#E3EFFB', COLORS.BACKGROUND] as const;
const STRIP_GRADIENT = ['#0A5A8C', '#5AB3E3'] as const;
const QR_GRADIENT = ['#0A5A8C', '#2E74AA'] as const;
const BANNER_GRADIENT = ['#2A6FA6', '#12395C'] as const;
const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });

const CATEGORY_ICONS: Record<RecordCategoryId, ComponentType<BookingIconProps>> = {
  VISIT_HISTORY: FileTextIcon,
  LAB_RESULTS: FlaskIcon,
  IMAGING: ScanIcon,
  PRESCRIPTIONS: PillIcon,
  VACCINATIONS: SyringeIcon,
  ALLERGIES: AlertTriangleIcon,
};

const TONE_STYLES: Record<RecordTone, { background: string; text: string }> = {
  DEFAULT: { background: '#E9EEF5', text: '#5B6B80' },
  SUCCESS: { background: '#E3F7EE', text: '#1E9E6A' },
  WARNING: { background: '#FFF1CC', text: '#B7791F' },
  DANGER: { background: DANGER_BACKGROUND, text: DANGER_TEXT },
};

const showComingSoon = () => Alert.alert('Thông báo', 'Chức năng đang được phát triển');

type HealthRecordScreenProps = {
  onPressBack?: () => void;
  onPressCategory?: (category: RecordCategory) => void;
};

export default function HealthRecordScreen({ onPressBack, onPressCategory }: HealthRecordScreenProps) {
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [overview, setOverview] = useState<HealthRecordOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  useEffect(() => {
    let isActive = true;
    getProfiles()
      .then((data) => {
        if (!isActive) return;
        setProfiles(data);
        const defaultProfile = data.find((item) => item.isSelf) ?? data[0];
        setActiveProfileId(defaultProfile ? defaultProfile.id : null);
      })
      .finally(() => {
        if (isActive) setIsLoadingProfiles(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeProfileId) {
      setOverview(null);
      return undefined;
    }
    let isActive = true;
    setIsLoadingOverview(true);
    getHealthRecordOverview(activeProfileId)
      .then((data) => {
        if (isActive) setOverview(data);
      })
      .finally(() => {
        if (isActive) setIsLoadingOverview(false);
      });
    return () => {
      isActive = false;
    };
  }, [activeProfileId]);

  const activeProfile = profiles.find((item) => item.id === activeProfileId);
  const isLoading = isLoadingProfiles || isLoadingOverview;

  const handlePressCategory = (category: RecordCategory) => {
    if (onPressCategory) onPressCategory(category);
    else showComingSoon();
  };

  const handleSelectProfile = (profile: Profile) => {
    setActiveProfileId(profile.id);
    setIsProfileSheetOpen(false);
  };

  const renderProfileCard = (profile: Profile) => (
    <View style={styles.card}>
      <LinearGradient
        colors={STRIP_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardStrip}
      />
      <View style={styles.profileBody}>
        <View style={styles.profileTop}>
          <View>
            <View style={styles.avatar}>
              <UserIcon size={34} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.6} />
            </View>
            <View style={styles.verifiedBadge}>
              <CheckIcon size={10} color={COLORS.SURFACE} strokeWidth={3} />
            </View>
          </View>
          <View style={styles.flex}>
            <Text style={styles.profileName}>{profile.fullName.toUpperCase()}</Text>
            <Text style={styles.profileCodeRow}>
              Mã BN: <Text style={styles.profileCode}>{profile.code}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.profileActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionOutline]}
            activeOpacity={0.85}
            onPress={() => setIsProfileSheetOpen(true)}
          >
            <BookUserIcon size={16} color={COLORS.PRIMARY} />
            <Text style={styles.actionOutlineText}>Đổi hồ sơ</Text>
            <ChevronDownIcon size={14} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.flex} activeOpacity={0.85} onPress={showComingSoon}>
            <LinearGradient
              colors={QR_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}
            >
              <QrCodeIcon size={16} color={COLORS.SURFACE} />
              <Text style={styles.actionFilledText}>Mã QR y tế</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderLatestVisit = () => {
    const visit = overview?.latestVisit;
    return (
      <>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Lần khám gần nhất</Text>
          <View style={styles.flex} />
          {visit && (
            <View style={[styles.chip, { backgroundColor: TONE_STYLES.DEFAULT.background }]}>
              <Text style={[styles.chipText, { color: TONE_STYLES.DEFAULT.text }]}>
                {visit.visitTypeLabel}
              </Text>
            </View>
          )}
        </View>

        {visit ? (
          <View style={[styles.card, styles.visitCard]}>
            <View style={styles.visitTop}>
              <View style={styles.iconBox}>
                <ClinicCardIcon size={24} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.8} />
              </View>
              <View style={styles.flex}>
                <View style={styles.departmentChip}>
                  <Text style={styles.departmentText}>{visit.department}</Text>
                </View>
                <Text style={styles.visitDoctor}>{visit.doctorName}</Text>
              </View>
            </View>

            <View style={styles.diagnosisBox}>
              <Text style={styles.diagnosisLabel}>CHẨN ĐOÁN XÁC ĐỊNH</Text>
              <Text style={styles.diagnosisValue}>{visit.diagnosis}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionOutline]}
                activeOpacity={0.85}
                onPress={showComingSoon}
              >
                <EyeIcon size={16} color={COLORS.PRIMARY} />
                <Text style={styles.actionOutlineText}>Xem tóm tắt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionSolid]}
                activeOpacity={0.85}
                onPress={showComingSoon}
              >
                <DownloadIcon size={16} color={COLORS.SURFACE} />
                <Text style={styles.actionFilledText}>Tải kết quả PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Chưa có lần khám nào.</Text>
        )}
      </>
    );
  };

  const renderCategory = (category: RecordCategory) => {
    const Icon = CATEGORY_ICONS[category.id];
    const tone = TONE_STYLES[category.badgeTone];
    const isDanger = category.badgeTone === 'DANGER';
    const accentColor = isDanger ? DANGER_TEXT : COLORS.PRIMARY;
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.card, styles.categoryCard]}
        activeOpacity={0.9}
        onPress={() => handlePressCategory(category)}
      >
        <View style={styles.categoryTop}>
          <View style={[styles.iconBox, isDanger && { backgroundColor: DANGER_BACKGROUND }]}>
            <Icon size={24} color={isDanger ? DANGER_TEXT : COLORS.PRIMARY_LIGHT} strokeWidth={1.8} />
          </View>
          <View style={[styles.chip, { backgroundColor: tone.background }]}>
            {category.badgeTone === 'SUCCESS' && (
              <View style={[styles.chipDot, { backgroundColor: tone.text }]} />
            )}
            <Text style={[styles.chipText, { color: tone.text }]}>{category.badgeLabel}</Text>
          </View>
        </View>

        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryDescription}>
          {category.highlight ? <Text style={styles.categoryHighlight}>{category.highlight} </Text> : null}
          {category.description}
        </Text>

        <View style={styles.categoryDivider} />

        <View style={styles.categoryAction}>
          <Text style={[styles.categoryActionText, { color: accentColor }]}>{category.actionLabel}</Text>
          <ChevronRightIcon size={18} color={accentColor} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
        </View>
      );
    }

    if (!activeProfile) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            Chưa có hồ sơ khám bệnh. Vui lòng tạo hồ sơ ở mục Đặt khám.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileCard(activeProfile)}
        {renderLatestVisit()}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Danh mục hồ sơ bệnh án</Text>
        </View>
        {overview?.categories.map(renderCategory)}

        <LinearGradient
          colors={BANNER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerTop}>
            <View style={styles.bannerIcon}>
              <ShieldCheckIcon size={22} color={COLORS.SURFACE} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.bannerTitle}>Bảo mật mã hóa y khoa E2EE</Text>
              <Text style={styles.bannerText}>
                Dữ liệu bệnh án của bạn được chứng thực bảo vệ theo tiêu chuẩn HL7/FHIR quốc tế.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bannerButton} activeOpacity={0.85} onPress={showComingSoon}>
            <Text style={styles.bannerButtonText}>Quản lý quyền chia sẻ</Text>
          </TouchableOpacity>
        </LinearGradient>
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
          <Text style={styles.headerTitle}>Hồ sơ sức khỏe</Text>
          <View style={styles.flex} />
          <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
            <SearchIcon size={22} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
            <ShareIcon size={22} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
            <HelpCircleIcon size={24} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
        </View>

        {renderBody()}
      </ScreenContainer>

      <Modal
        visible={isProfileSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsProfileSheetOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsProfileSheetOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.sheetTitle}>Chọn hồ sơ</Text>
            {profiles.map((profile) => {
              const isSelected = profile.id === activeProfileId;
              return (
                <TouchableOpacity
                  key={profile.id}
                  style={styles.sheetOption}
                  activeOpacity={0.8}
                  onPress={() => handleSelectProfile(profile)}
                >
                  <View style={styles.flex}>
                    <Text style={[styles.sheetName, isSelected && { color: COLORS.PRIMARY_LIGHT }]}>
                      {profile.fullName.toUpperCase()}
                    </Text>
                    <Text style={styles.sheetCode}>{profile.code}</Text>
                  </View>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 10,
  },
  headerTitle: { marginLeft: -4, fontFamily: FONTS.BOLD, fontSize: 18, color: COLORS.PRIMARY },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 12, paddingBottom: 24 },
  card: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardStrip: { height: 5 },
  profileBody: { padding: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: ICON_BOX_BACKGROUND,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
    backgroundColor: VERIFIED_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontFamily: FONTS.BOLD, fontSize: 22, lineHeight: 28, color: NAVY },
  profileCodeRow: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },
  profileCode: { fontFamily: MONO_FONT, fontWeight: '700', color: COLORS.PRIMARY_LIGHT },
  divider: { height: 1, marginVertical: 14, backgroundColor: COLORS.BORDER },
  profileActions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  actionOutline: {
    borderWidth: 1,
    borderColor: '#B9D6F0',
    backgroundColor: '#EAF3FC',
  },
  actionSolid: { backgroundColor: COLORS.PRIMARY },
  actionOutlineText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  actionFilledText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.SURFACE },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 12 },
  sectionBar: { width: 5, height: 20, borderRadius: 3, backgroundColor: COLORS.PRIMARY_LIGHT },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 18, color: NAVY },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontFamily: FONTS.BOLD, fontSize: 11 },
  emptyText: { textAlign: 'center', fontFamily: FONTS.REGULAR, fontSize: 13, color: MUTED_TEXT },
  visitCard: { padding: 16 },
  visitTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: ICON_BOX_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departmentChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: ICON_BOX_BACKGROUND,
  },
  departmentText: { fontFamily: FONTS.BOLD, fontSize: 11, color: COLORS.PRIMARY },
  visitDoctor: { marginTop: 6, fontFamily: FONTS.BOLD, fontSize: 18, color: NAVY },
  diagnosisBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#EEF4FB',
  },
  diagnosisLabel: { fontFamily: FONTS.BOLD, fontSize: 10, letterSpacing: 0.5, color: MUTED_TEXT },
  diagnosisValue: { marginTop: 4, fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.PRIMARY },
  categoryCard: { padding: 16, marginBottom: 14 },
  categoryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryTitle: { marginTop: 12, fontFamily: FONTS.BOLD, fontSize: 20, lineHeight: 26, color: COLORS.TEXT },
  categoryDescription: {
    marginTop: 6,
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.TEXT_MUTED,
  },
  categoryHighlight: { fontFamily: FONTS.BOLD, color: DANGER_TEXT },
  categoryDivider: { height: 1, marginTop: 14, backgroundColor: COLORS.BORDER },
  categoryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  categoryActionText: { fontFamily: FONTS.BOLD, fontSize: 13 },
  banner: { marginTop: 4, padding: 18, borderRadius: 22 },
  bannerTop: { flexDirection: 'row', gap: 14 },
  bannerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.SURFACE },
  bannerText: { marginTop: 4, fontFamily: FONTS.REGULAR, fontSize: 12, lineHeight: 18, color: '#D6E8F8' },
  bannerButton: {
    alignSelf: 'center',
    marginTop: 14,
    height: 42,
    paddingHorizontal: 28,
    borderRadius: 21,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerButtonText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(19, 29, 37, 0.4)' },
  sheet: {
    maxHeight: '60%',
    paddingTop: 16,
    paddingHorizontal: SCREEN_PADDING,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.SURFACE,
  },
  sheetTitle: { marginBottom: 8, fontFamily: FONTS.BOLD, fontSize: 16, color: COLORS.TEXT },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  sheetName: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.TEXT },
  sheetCode: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
});