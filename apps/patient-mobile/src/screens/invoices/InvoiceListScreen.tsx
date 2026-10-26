import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
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
import ScreenContainer from '../../components/ScreenContainer';
import {
  BadgeCheckIcon,
  BriefcaseMedicalIcon,
  ReceiptIcon,
  UserIcon,
} from '../../components/icons';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  DownloadCircleIcon,
  DownloadIcon,
  FileTextIcon,
  HelpCircleIcon,
  SearchIcon,
  SlidersIcon,
  SwapIcon,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  formatIssuedDate,
  formatIssuedMonth,
  formatIssuedTime,
  getInvoiceOverview,
  getIssuedMonthKey,
  PAYMENT_METHOD_LABELS,
  type Invoice,
  type InvoiceOverview,
} from '../../services/invoiceService';
import { getProfiles, type Profile } from '../../services/profileService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type OptionSheetItem = {
  id: string;
  label: string;
  description?: string;
};

type OptionSheetProps = {
  visible: boolean;
  title: string;
  options: OptionSheetItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

function OptionSheet({ visible, title, options, selectedId, onSelect, onClose }: OptionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheetStyles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={sheetStyles.title}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const isSelected = option.id === selectedId;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={sheetStyles.option}
                  activeOpacity={0.8}
                  onPress={() => onSelect(option.id)}
                >
                  <View style={sheetStyles.flex}>
                    <Text style={[sheetStyles.label, isSelected && sheetStyles.labelActive]}>
                      {option.label}
                    </Text>
                    {option.description ? (
                      <Text style={sheetStyles.description}>{option.description}</Text>
                    ) : null}
                  </View>
                  {isSelected && <CheckIcon size={18} color={COLORS.PRIMARY_LIGHT} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(19, 29, 37, 0.4)' },
  sheet: {
    maxHeight: '60%',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.SURFACE,
  },
  title: { marginBottom: 8, fontFamily: FONTS.BOLD, fontSize: 16, color: COLORS.TEXT },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  label: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.TEXT },
  labelActive: { color: COLORS.PRIMARY_LIGHT },
  description: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
});

const SCREEN_PADDING = 16;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const BACKGROUND_GRADIENT = ['#E3EFFB', COLORS.BACKGROUND] as const;
const STATS_GRADIENT = ['#2F78B0', '#16406A'] as const;
const STRIP_GRADIENT = ['#8FD0F5', '#0A5A8C'] as const;
const ICON_BOX_BACKGROUND = '#DCEBFA';
const SUCCESS_TEXT = '#1E9E6A';
const SUCCESS_BACKGROUND = '#E3F7EE';
const SUCCESS_BORDER = '#BFE8D4';
const WARNING_TEXT = '#B7791F';
const WARNING_BACKGROUND = '#FFF1CC';
const ALL_MONTHS_ID = 'ALL';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();

const formatNumber = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const getInitials = (fullName: string) => {
  const words = fullName.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
};

const maskPhone = (phone: string) =>
  phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : phone;

const showComingSoon = () => Alert.alert('Thông báo', 'Chức năng đang được phát triển');

type InvoiceListScreenProps = {
  onPressBack?: () => void;
  onPressInvoice?: (invoice: Invoice) => void;
};

export default function InvoiceListScreen({ onPressBack, onPressInvoice }: InvoiceListScreenProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [overview, setOverview] = useState<InvoiceOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isVatOnly, setIsVatOnly] = useState(true);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isMonthSheetOpen, setIsMonthSheetOpen] = useState(false);

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
    getInvoiceOverview(activeProfileId)
      .then((data) => {
        if (!isActive) return;
        setOverview(data);
        setSelectedMonthId(data.invoices[0] ? getIssuedMonthKey(data.invoices[0].issuedAt) : ALL_MONTHS_ID);
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
  const query = normalizeText(searchText.trim());

  const vatCount = useMemo(
    () => overview?.invoices.filter((item) => item.vatStatus === 'ISSUED').length ?? 0,
    [overview],
  );

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set((overview?.invoices ?? []).map((item) => getIssuedMonthKey(item.issuedAt))));
    return [
      { id: ALL_MONTHS_ID, label: 'Tất cả các tháng' },
      ...keys.map((key) => ({ id: key, label: formatIssuedMonth(key) })),
    ];
  }, [overview]);

  const visibleInvoices = useMemo(
    () =>
      (overview?.invoices ?? []).filter((invoice) => {
        if (isVatOnly && invoice.vatStatus !== 'ISSUED') return false;
        if (selectedMonthId && selectedMonthId !== ALL_MONTHS_ID) {
          if (getIssuedMonthKey(invoice.issuedAt) !== selectedMonthId) return false;
        }
        if (!query) return true;
        const haystack = normalizeText(
          [
            invoice.code,
            invoice.serviceName,
            invoice.doctorName,
            invoice.location,
            formatIssuedDate(invoice.issuedAt),
          ].join(' '),
        );
        return haystack.includes(query);
      }),
    [overview, isVatOnly, selectedMonthId, query],
  );

  const monthLabel =
    selectedMonthId && selectedMonthId !== ALL_MONTHS_ID
      ? formatIssuedMonth(selectedMonthId)
      : 'Tất cả các tháng';

  const renderInvoice = (invoice: Invoice, index: number) => {
    const isVatIssued = invoice.vatStatus === 'ISSUED';
    return (
      <View key={invoice.id} style={styles.card}>
        {index === 0 && (
          <LinearGradient
            colors={STRIP_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardStrip}
          />
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.invoiceIcon}>
              <BriefcaseMedicalIcon size={22} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.8} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.invoiceCode}>#{invoice.code}</Text>
              <Text style={styles.issuedText}>Phát hành lúc {formatIssuedTime(invoice.issuedAt)}</Text>
              <Text style={styles.issuedText}>{formatIssuedDate(invoice.issuedAt)}</Text>
            </View>
            <View
              style={[
                styles.vatPill,
                isVatIssued ? styles.vatPillIssued : styles.vatPillPending,
              ]}
            >
              {isVatIssued && <CheckCircleIcon size={13} color={SUCCESS_TEXT} />}
              <Text style={[styles.vatText, { color: isVatIssued ? SUCCESS_TEXT : WARNING_TEXT }]}>
                {isVatIssued ? 'Đã xuất VAT' : 'Chờ xuất VAT'}
              </Text>
            </View>
          </View>

          <View style={styles.serviceBox}>
            <View style={styles.serviceTitleRow}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {invoice.serviceName}
              </Text>
              <View style={styles.methodChip}>
                <Text style={styles.methodText}>{PAYMENT_METHOD_LABELS[invoice.paymentMethod]}</Text>
              </View>
            </View>
            <View style={styles.doctorRow}>
              <UserIcon size={13} color={COLORS.PRIMARY_LIGHT} />
              <Text style={styles.doctorText} numberOfLines={1}>
                {invoice.doctorName} • {invoice.location}
              </Text>
            </View>
          </View>

          <Text style={styles.amount}>{formatNumber(invoice.amount)} đ</Text>

          <View style={styles.divider} />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionOutline]}
              activeOpacity={0.85}
              onPress={() => onPressInvoice?.(invoice)}
            >
              <FileTextIcon size={16} color={COLORS.PRIMARY} />
              <Text style={styles.actionOutlineText}>Xem chi tiết</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionSolid]}
              activeOpacity={0.85}
              onPress={showComingSoon}
            >
              <DownloadIcon size={16} color={COLORS.SURFACE} />
              <Text style={styles.actionSolidText}>Tải về máy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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

    if (!activeProfile || !overview) {
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileBar}>
          <View style={styles.initials}>
            <Text style={styles.initialsText}>{getInitials(activeProfile.fullName)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.profileName} numberOfLines={1}>
              {activeProfile.fullName.toUpperCase()}
            </Text>
            <Text style={styles.profilePhone}>SĐT: {maskPhone(activeProfile.phone)}</Text>
          </View>
          <TouchableOpacity hitSlop={10} onPress={() => setIsProfileSheetOpen(true)}>
            <SwapIcon size={22} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={STATS_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.stats}
        >
          <View style={styles.statsTop}>
            <BadgeCheckIcon size={18} color="#CFE6FA" />
            <Text style={styles.statsTitle}>THỐNG KÊ VIỆN PHÍ NĂM {overview.year}</Text>
            <View style={styles.flex} />
            <View style={styles.statsCount}>
              <ReceiptIcon size={13} color={COLORS.SURFACE} />
              <Text style={styles.statsCountText}>{overview.invoiceCount}</Text>
            </View>
          </View>
          <Text style={styles.statsLabel}>Tổng người bệnh chi trả thực tế</Text>
          <View style={styles.statsAmountRow}>
            <Text style={styles.statsAmount}>{formatNumber(overview.totalPaid)}</Text>
            <Text style={styles.statsUnit}>VNĐ</Text>
          </View>
        </LinearGradient>

        <View style={styles.searchRow}>
          <SearchIcon size={20} color={COLORS.ICON_MUTED} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tìm theo mã hóa đơn, bác sĩ, ngày khám..."
            placeholderTextColor={COLORS.PLACEHOLDER}
          />
          <TouchableOpacity hitSlop={8} onPress={showComingSoon}>
            <SlidersIcon size={20} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.filterChip, isVatOnly && styles.filterChipActive]}
          activeOpacity={0.85}
          onPress={() => setIsVatOnly(!isVatOnly)}
        >
          <Text style={[styles.filterText, isVatOnly && styles.filterTextActive]}>
            Đã thanh toán VAT
          </Text>
          <View style={[styles.filterBadge, isVatOnly && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeText, isVatOnly && { color: COLORS.PRIMARY }]}>
              {vatCount}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Danh sách hóa đơn gần đây</Text>
          <TouchableOpacity
            style={styles.monthButton}
            hitSlop={8}
            onPress={() => setIsMonthSheetOpen(true)}
          >
            <CalendarIcon size={14} color={COLORS.PRIMARY} />
            <Text style={styles.monthText}>{monthLabel}</Text>
          </TouchableOpacity>
        </View>

        {visibleInvoices.length === 0 ? (
          <Text style={styles.emptyText}>Không tìm thấy hóa đơn phù hợp.</Text>
        ) : (
          visibleInvoices.map(renderInvoice)
        )}
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
          <Text style={styles.headerTitle}>Hóa đơn viện phí</Text>
          <View style={styles.flex} />
          <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
            <DownloadCircleIcon size={24} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
            <HelpCircleIcon size={24} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
        </View>

        {renderBody()}
      </ScreenContainer>

      <OptionSheet
        visible={isProfileSheetOpen}
        title="Chọn hồ sơ"
        options={profiles.map((profile) => ({
          id: profile.id,
          label: profile.fullName.toUpperCase(),
          description: profile.code,
        }))}
        selectedId={activeProfileId}
        onSelect={(id) => {
          setActiveProfileId(id);
          setIsProfileSheetOpen(false);
        }}
        onClose={() => setIsProfileSheetOpen(false)}
      />

      <OptionSheet
        visible={isMonthSheetOpen}
        title="Chọn tháng"
        options={monthOptions}
        selectedId={selectedMonthId}
        onSelect={(id) => {
          setSelectedMonthId(id);
          setIsMonthSheetOpen(false);
        }}
        onClose={() => setIsMonthSheetOpen(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {},
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
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  initials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ICON_BOX_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  profileName: { fontFamily: FONTS.BOLD, fontSize: 14, color: NAVY },
  profilePhone: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  stats: {
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  statsTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsTitle: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, letterSpacing: 0.6, color: '#D6E8F8' },
  statsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  statsCountText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.SURFACE },
  statsLabel: { marginTop: 18, fontFamily: FONTS.REGULAR, fontSize: 13, color: '#9FD0F5' },
  statsAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  statsAmount: { fontFamily: FONTS.EXTRA_BOLD, fontSize: 38, color: COLORS.SURFACE },
  statsUnit: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: '#D6E8F8' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  searchInput: { flex: 1, height: 50, fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT },
  filterChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    marginTop: 14,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  filterChipActive: { borderColor: COLORS.PRIMARY_LIGHT, backgroundColor: COLORS.PRIMARY_LIGHT },
  filterText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT_MUTED },
  filterTextActive: { color: COLORS.SURFACE },
  filterBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#E9EEF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: { backgroundColor: '#D6E8F8' },
  filterBadgeText: { fontFamily: FONTS.BOLD, fontSize: 11, color: COLORS.TEXT_MUTED },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  listTitle: { fontFamily: FONTS.BOLD, fontSize: 18, color: NAVY },
  monthButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  monthText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.PRIMARY },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    color: MUTED_TEXT,
  },
  card: {
    overflow: 'hidden',
    marginBottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  cardStrip: { height: 5 },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  invoiceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ICON_BOX_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceCode: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  issuedText: { marginTop: 2, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  vatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  vatPillIssued: { borderColor: SUCCESS_BORDER, backgroundColor: SUCCESS_BACKGROUND },
  vatPillPending: { borderColor: WARNING_BACKGROUND, backgroundColor: WARNING_BACKGROUND },
  vatText: { fontFamily: FONTS.BOLD, fontSize: 11 },
  serviceBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#EEF4FB',
  },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceName: { flex: 1, fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.TEXT },
  methodChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  methodText: { fontFamily: FONTS.BOLD, fontSize: 10, color: SUCCESS_TEXT },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  doctorText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.PRIMARY_LIGHT },
  amount: { marginTop: 14, fontFamily: FONTS.BOLD, fontSize: 20, color: COLORS.PRIMARY },
  divider: { height: 1, marginVertical: 14, backgroundColor: COLORS.BORDER },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  actionOutline: { borderWidth: 1, borderColor: '#B9D6F0', backgroundColor: '#EAF3FC' },
  actionSolid: { backgroundColor: COLORS.PRIMARY },
  actionOutlineText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.PRIMARY },
  actionSolidText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.SURFACE },
});