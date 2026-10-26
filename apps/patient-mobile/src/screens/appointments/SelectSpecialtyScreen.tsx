import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
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
  ArrowRightIcon,
  BadgeCheckIcon,
  BotIcon,
  CheckIcon,
  ClockIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersIcon,
  SparklesIcon,
  SPECIALTY_ICONS,
  SwapIcon,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import type { Profile } from '../../services/profileService';
import {
  getSpecialtyCatalog,
  type Specialty,
  type SpecialtyCatalog,
  type SpecialtyService,
} from '../../services/specialtyService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type SpecialtyTab = 'SPECIALTY' | 'SERVICE' | 'GENERAL';

const BOOKING_STEPS = ['Hồ sơ', 'Khoa khám', 'Bác sĩ & Giờ', 'Xác nhận'];
const CURRENT_STEP_INDEX = 1;
const TABS: { value: SpecialtyTab; label: string }[] = [
  { value: 'SPECIALTY', label: 'Chuyên khoa' },
  { value: 'SERVICE', label: 'Dịch vụ' },
  { value: 'GENERAL', label: 'Tổng quát' },
];

const SCREEN_PADDING = 16;
const GRID_COLUMNS = 4;
const GRID_GAP = 10;
const BUTTON_GRADIENT = ['#3A80B2', '#005B8D'] as const;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const SUCCESS_TEXT = '#1E9E6A';
const SUCCESS_BACKGROUND = '#E3F7EE';
const NEUTRAL_CHIP_TEXT = '#6B7A90';
const NEUTRAL_CHIP_BACKGROUND = '#EAEFF6';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();

const formatFee = (value: number) => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

export type SpecialtySelection = {
  specialty: Specialty;
  service: SpecialtyService;
};

type SelectSpecialtyScreenProps = {
  profile: Profile;
  onPressBack?: () => void;
  onPressHome?: () => void;
  onPressChangeProfile?: () => void;
  onPressFilter?: () => void;
  onPressAssistant?: () => void;
  onPressAllSpecialties?: () => void;
  onContinue?: (selection: SpecialtySelection) => void;
};

export default function SelectSpecialtyScreen({
  profile,
  onPressBack,
  onPressHome,
  onPressChangeProfile,
  onPressFilter,
  onPressAssistant,
  onPressAllSpecialties,
  onContinue,
}: SelectSpecialtyScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const hasPendingScrollRef = useRef(false);

  const [catalog, setCatalog] = useState<SpecialtyCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<SpecialtyTab>('SPECIALTY');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    getSpecialtyCatalog()
      .then((data) => {
        if (isActive) setCatalog(data);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const query = normalizeText(searchText.trim());

  const visibleSpecialties = useMemo(() => {
    const popular = catalog?.popular ?? [];
    if (!query) return popular;
    return popular.filter(
      (specialty) =>
        normalizeText(specialty.name).includes(query) ||
        specialty.services.some((service) => normalizeText(service.name).includes(query)),
    );
  }, [catalog, query]);

  const selectedSpecialty = catalog?.popular.find((item) => item.id === selectedSpecialtyId);
  const selectedService = selectedSpecialty?.services.find((item) => item.id === selectedServiceId);
  const canContinue = !!selectedSpecialty && !!selectedService;

  const itemWidth =
    (width - SCREEN_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const handleSelectSpecialty = (specialty: Specialty) => {
    hasPendingScrollRef.current = true;
    setSelectedSpecialtyId(specialty.id);
    setSelectedServiceId(null);
  };

  const handleDetailLayout = (event: LayoutChangeEvent) => {
    if (!hasPendingScrollRef.current) return;
    hasPendingScrollRef.current = false;
    scrollRef.current?.scrollTo({ y: event.nativeEvent.layout.y - 12, animated: true });
  };

  const handleContinue = () => {
    if (selectedSpecialty && selectedService) {
      onContinue?.({ specialty: selectedSpecialty, service: selectedService });
    }
  };

  const renderSpecialtyGrid = () => {
    if (visibleSpecialties.length === 0) {
      return <Text style={styles.noticeText}>Không tìm thấy chuyên khoa phù hợp.</Text>;
    }
    return (
      <View style={styles.grid}>
        {visibleSpecialties.map((specialty) => {
          const isSelected = specialty.id === selectedSpecialtyId;
          const Icon = SPECIALTY_ICONS[specialty.iconKey];
          return (
            <TouchableOpacity
              key={specialty.id}
              style={[styles.gridItem, { width: itemWidth }, isSelected && styles.gridItemSelected]}
              activeOpacity={0.85}
              onPress={() => handleSelectSpecialty(specialty)}
            >
              <View style={[styles.gridIcon, isSelected && styles.gridIconSelected]}>
                <Icon size={20} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.8} />
              </View>
              <Text style={styles.gridName} numberOfLines={1}>
                {specialty.name}
              </Text>
              <Text style={styles.gridCount} numberOfLines={1}>
                {specialty.doctorCount} bác sĩ
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderDetailList = (specialty: Specialty) => (
    <View key={specialty.id} style={styles.detailSection} onLayout={handleDetailLayout}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>Danh sách chi tiết</Text>
        <Text style={styles.detailSort}>Sắp xếp: Phổ biến nhất</Text>
      </View>

      {specialty.services.map((service) => {
        const isSelected = service.id === selectedServiceId;
        const Icon = SPECIALTY_ICONS[service.iconKey];
        return (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              isSelected && styles.serviceCardSelected,
              !service.isAvailable && styles.serviceCardDisabled,
            ]}
            activeOpacity={0.85}
            disabled={!service.isAvailable}
            onPress={() => setSelectedServiceId(service.id)}
          >
            <View style={styles.serviceTop}>
              <View style={[styles.serviceIcon, isSelected && styles.serviceIconSelected]}>
                <Icon
                  size={22}
                  color={isSelected ? COLORS.SURFACE : COLORS.PRIMARY_LIGHT}
                  strokeWidth={1.8}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription} numberOfLines={3}>
                  {service.description}
                </Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <CheckIcon size={12} color={COLORS.SURFACE} strokeWidth={3} />}
              </View>
            </View>

            <View style={styles.serviceDivider} />

            <View style={styles.serviceBottom}>
              <Text style={styles.feeLabel}>Phí khám từ:</Text>
              <Text style={styles.feeValue}>{formatFee(service.minFee)}</Text>
              {service.isAvailable ? (
                <View style={[styles.statusChip, styles.statusChipAvailable]}>
                  <View style={styles.statusDot} />
                  <Text style={[styles.statusText, { color: SUCCESS_TEXT }]}>Có lịch</Text>
                </View>
              ) : (
                <View style={[styles.statusChip, styles.statusChipUnavailable]}>
                  <ClockIcon size={11} color={NEUTRAL_CHIP_TEXT} />
                  <Text style={[styles.statusText, { color: NEUTRAL_CHIP_TEXT }]}>Đã hết lịch</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.noteCard}>
        <ShieldCheckIcon size={18} color={COLORS.PRIMARY_LIGHT} />
        <Text style={styles.noteText}>
          Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm từ các bệnh viện tuyến đầu.
        </Text>
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

    return (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileBar}>
          <View style={styles.profileAvatar}>
            <UserIcon size={20} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.8} />
          </View>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile.fullName.toUpperCase()}
          </Text>
          {profile.isSelf && (
            <View style={styles.profileTag}>
              <Text style={styles.profileTagText}>Tôi</Text>
            </View>
          )}
          <View style={styles.flex} />
          <TouchableOpacity
            style={styles.changeButton}
            activeOpacity={0.8}
            onPress={onPressChangeProfile}
          >
            <Text style={styles.changeText}>Đổi</Text>
            <SwapIcon size={14} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <SearchIcon size={18} color={COLORS.ICON_MUTED} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tìm chuyên khoa, triệu chứng, bác sĩ..."
            placeholderTextColor={COLORS.PLACEHOLDER}
          />
          <TouchableOpacity hitSlop={8} onPress={onPressFilter}>
            <SlidersIcon size={18} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.value)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.aiBanner}>
          <View style={styles.aiIcon}>
            <SparklesIcon size={20} color={COLORS.PRIMARY_LIGHT} />
          </View>
          <Text style={styles.aiText}>Chưa rõ triệu chứng ?</Text>
          <TouchableOpacity style={styles.aiButton} activeOpacity={0.85} onPress={onPressAssistant}>
            <BotIcon size={16} color={COLORS.SURFACE} />
            <Text style={styles.aiButtonText}>Hỏi Trợ lý AI</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'SPECIALTY' ? (
          <>
            <View style={styles.sectionHeader}>
              <BadgeCheckIcon size={20} color={COLORS.PRIMARY_LIGHT} />
              <Text style={styles.sectionTitle}>Chuyên khoa phổ biến</Text>
              <View style={styles.flex} />
              <TouchableOpacity onPress={onPressAllSpecialties}>
                <Text style={styles.sectionLink}>Tất cả ({catalog?.totalCount ?? 0})</Text>
              </TouchableOpacity>
            </View>

            {renderSpecialtyGrid()}
            {selectedSpecialty ? renderDetailList(selectedSpecialty) : null}
          </>
        ) : (
          <Text style={styles.noticeText}>Nội dung đang được cập nhật.</Text>
        )}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Đặt khám" onPressBack={onPressBack} onPressHome={onPressHome} />
      <BookingStepper steps={BOOKING_STEPS} currentIndex={CURRENT_STEP_INDEX} />

      {renderBody()}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerInfo}>
          {selectedService ? (
            <Text style={styles.footerLabel} numberOfLines={1}>
              Đã chọn: <Text style={styles.footerValue}>{selectedService.name}</Text>
            </Text>
          ) : (
            <Text style={styles.footerLabel} numberOfLines={1}>
              Chọn một chuyên khoa và dịch vụ để tiếp tục
            </Text>
          )}
          <Text style={styles.footerStep}>
            Bước {CURRENT_STEP_INDEX + 1}/{BOOKING_STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          {canContinue ? (
            <LinearGradient
              colors={BUTTON_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>TIẾP TỤC CHỌN BÁC SĨ & LỊCH</Text>
              <ArrowRightIcon size={18} color={COLORS.SURFACE} />
            </LinearGradient>
          ) : (
            <View style={[styles.continueButton, styles.continueDisabled]}>
              <Text style={styles.continueText}>TIẾP TỤC CHỌN BÁC SĨ & LỊCH</Text>
              <ArrowRightIcon size={18} color={COLORS.SURFACE} />
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 16, paddingBottom: 24 },
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#E6F0FA',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { flexShrink: 1, fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.TEXT },
  profileTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.SURFACE,
  },
  profileTagText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 10, color: COLORS.TEXT_MUTED },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.SURFACE,
  },
  changeText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  searchInput: { flex: 1, height: 46, fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT },
  tabs: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#E9EEF5',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 34, borderRadius: 11 },
  tabActive: {
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED },
  tabTextActive: { fontFamily: FONTS.BOLD, color: COLORS.PRIMARY_LIGHT },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#DDEBFA',
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { flex: 1, fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.TEXT_MUTED },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: NAVY,
  },
  aiButtonText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.SURFACE },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT },
  sectionLink: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  noticeText: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    color: MUTED_TEXT,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  gridItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  gridItemSelected: { borderColor: COLORS.PRIMARY_LIGHT },
  gridIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconSelected: { backgroundColor: '#D2E6F8' },
  gridName: {
    marginTop: 8,
    maxWidth: '100%',
    fontFamily: FONTS.BOLD,
    fontSize: 11,
    color: COLORS.TEXT,
  },
  gridCount: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 9, color: MUTED_TEXT },
  detailSection: { marginTop: 20 },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTitle: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT },
  detailSort: { fontFamily: FONTS.REGULAR, fontSize: 11, color: MUTED_TEXT },
  serviceCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCardSelected: { borderColor: NAVY },
  serviceCardDisabled: { opacity: 0.7 },
  serviceTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconSelected: { backgroundColor: NAVY },
  serviceName: { fontFamily: FONTS.BOLD, fontSize: 15, lineHeight: 20, color: COLORS.TEXT },
  serviceDescription: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.TEXT_MUTED,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C3CCD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: NAVY, backgroundColor: NAVY },
  serviceDivider: { height: 1, marginVertical: 12, backgroundColor: COLORS.BORDER },
  serviceBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feeLabel: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  feeValue: { flex: 1, fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.PRIMARY },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusChipAvailable: { backgroundColor: SUCCESS_BACKGROUND },
  statusChipUnavailable: { backgroundColor: NEUTRAL_CHIP_BACKGROUND },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS_TEXT },
  statusText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11 },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#E6F0FA',
  },
  noteText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 11, lineHeight: 16, color: COLORS.TEXT_MUTED },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  footerLabel: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  footerValue: { fontFamily: FONTS.BOLD, color: COLORS.PRIMARY_LIGHT },
  footerStep: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: MUTED_TEXT },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  continueDisabled: { backgroundColor: '#B8C4D2' },
  continueText: { fontFamily: FONTS.BOLD, fontSize: 13, letterSpacing: 0.3, color: COLORS.SURFACE },
});