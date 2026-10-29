import { useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import {
  BadgePercentIcon,
  BookHeartIcon,
  ChevronRightIcon,
  HeartHandshakeIcon,
  HeartPulseIcon,
  LookupColorIcon,
  NewspaperIcon,
  PhoneCallIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersIcon,
  SparklesIcon,
  StarIcon,
  type IconComponent,
} from '../../components/icons';
import {
  BotColorIcon,
  ClipboardPulseColorIcon,
  CreditCardColorIcon,
  FlaskSearchColorIcon,
  FolderClockColorIcon,
  ReceiptColorIcon,
  StethoscopeColorIcon,
} from '../../components/featureIcons';
import { COLORS, FONTS } from '../../constants/theme';

const BANNER_IMAGE = require('../../../assets/images/hospital-banner.jpg');

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type Feature = {
  key: string;
  label: string;
  Icon: IconComponent;
  isAi?: boolean;
};

type NewsItem = {
  id: string;
  title: string;
};

const MAIN_FEATURES: Feature[] = [
  { key: 'booking', label: 'Đặt khám', Icon: StethoscopeColorIcon },
  { key: 'booking-history', label: 'Lịch sử đặt khám', Icon: FolderClockColorIcon },
  { key: 'payment', label: 'Thanh toán viện phí', Icon: CreditCardColorIcon },
  { key: 'invoice', label: 'Hoá đơn', Icon: ReceiptColorIcon },
  { key: 'health-record', label: 'Hồ sơ sức khoẻ', Icon: ClipboardPulseColorIcon },
  { key: 'lab-results', label: 'Kết quả cận lâm sàng', Icon: FlaskSearchColorIcon },
  { key: 'search', label: 'Tra cứu', Icon: LookupColorIcon },
  { key: 'chatbot', label: 'Chatbot', Icon: BotColorIcon, isAi: true },
];

const OTHER_FEATURES: Feature[] = [
  { key: 'guide', label: 'Hướng dẫn khách hàng', Icon: HeartHandshakeIcon },
  { key: 'featured-services', label: 'Dịch vụ nổi bật', Icon: SparklesIcon },
  { key: 'price-list', label: 'Bảng giá dịch vụ kỹ thuật', Icon: BadgePercentIcon },
  { key: 'health-library', label: 'Thư viện sức khoẻ', Icon: BookHeartIcon },
  { key: 'news-events', label: 'Tin tức - Sự kiện', Icon: NewspaperIcon },
  { key: 'contact', label: 'Liên hệ', Icon: PhoneCallIcon },
  { key: 'rating', label: 'Đánh giá', Icon: StarIcon },
];

const NEWS: NewsItem[] = [
  { id: '1', title: 'Cùng tham gia chương trình tầm soát sức khoẻ tim mạch' },
  {
    id: '2',
    title: 'Thông báo quy trình tiếp nhận và hướng dẫn khám chữa bệnh theo hình thức mới',
  },
  { id: '3', title: 'Lịch khám chuyên khoa và khung giờ làm việc dịp cuối năm' },
  { id: '4', title: 'Hướng dẫn thanh toán viện phí trực tuyến an toàn, nhanh chóng' },
  { id: '5', title: 'Chương trình khám sức khoẻ định kỳ dành cho người cao tuổi' },
  { id: '6', title: 'Khai trương phòng khám chuyên sâu về tiêu hoá và gan mật' },
];

const NEWS_PER_PAGE = 2;
const NEWS_PAGES: NewsItem[][] = Array.from(
  { length: Math.ceil(NEWS.length / NEWS_PER_PAGE) },
  (_, pageIndex) => NEWS.slice(pageIndex * NEWS_PER_PAGE, (pageIndex + 1) * NEWS_PER_PAGE),
);

const SCREEN_PADDING = 16;

type HomeScreenProps = {
  onPressFeature?: (key: string) => void;
  onPressNews?: (id: string) => void;
  onPressMoreNews?: () => void;
  onPressSearch?: () => void;
  onPressFilter?: () => void;
};

type FeatureGridProps = {
  items: Feature[];
  isTinted: boolean;
  onPress?: (key: string) => void;
};

function FeatureGrid({ items, isTinted, onPress }: FeatureGridProps) {
  return (
    <View style={styles.grid}>
      {items.map(({ key, label, Icon, isAi }) => (
        <TouchableOpacity
          key={key}
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={() => onPress?.(key)}
        >
          {isTinted ? (
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={[COLORS.TILE_TOP, COLORS.TILE_BOTTOM]}
                style={[styles.iconBox, styles.iconBoxTinted]}
              >
                <Icon size={36} color={COLORS.PRIMARY} strokeWidth={1.7} />
              </LinearGradient>
              {isAi && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.iconBox, styles.iconBoxPlain]}>
              <Icon size={28} color={COLORS.PRIMARY} strokeWidth={1.7} />
            </View>
          )}
          <Text style={styles.gridLabel} numberOfLines={2}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function HomeScreen({
  onPressFeature,
  onPressNews,
  onPressMoreNews,
  onPressSearch,
  onPressFilter,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const pageWidth = width - SCREEN_PADDING * 2;
  const [newsPageIndex, setNewsPageIndex] = useState(0);

  const handleNewsScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setNewsPageIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  return (
    <LinearGradient
      colors={[COLORS.BACKGROUND_TOP, COLORS.BACKGROUND]}
      locations={[0, 0.45]}
      style={styles.flex}
    >
      <View style={styles.blob} pointerEvents="none" />
      <ScreenContainer style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <LinearGradient
              colors={[COLORS.LOGO_GRADIENT_START, COLORS.LOGO_GRADIENT_END]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <HeartPulseIcon size={32} color={COLORS.PRIMARY} strokeWidth={1.8} />
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.brandTitle}>MEDICONNECT</Text>
              <Text style={styles.brandSubtitle}>Ứng dụng dành cho{'\n'}Người bệnh</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.sectionTitleLarge}>Chức năng</Text>
              <View style={styles.actionPill}>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.8}
                  onPress={onPressFilter}
                >
                  <SlidersIcon size={18} color={COLORS.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.8}
                  onPress={onPressSearch}
                >
                  <SearchIcon size={18} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              </View>
            </View>
            <FeatureGrid items={MAIN_FEATURES} isTinted onPress={onPressFeature} />
          </View>

          <ImageBackground source={BANNER_IMAGE} resizeMode="cover" style={styles.banner}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
              style={styles.bannerOverlay}
            />
            <View style={styles.bannerBadge}>
              <ShieldCheckIcon size={16} color={COLORS.PRIMARY} />
              <Text style={styles.bannerBadgeText}>MEDICONNECT</Text>
            </View>
            <View style={styles.bannerTextBlock}>
              <Text style={styles.bannerCaption}>Chuẩn mực y khoa quốc tế</Text>
              <Text
                style={styles.bannerTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                Tận tâm chăm sóc - Trọn vẹn niềm tin
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tin tức nổi bật</Text>
            <TouchableOpacity hitSlop={8} onPress={onPressMoreNews}>
              <Text style={styles.moreText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.newsPager}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleNewsScrollEnd}
            >
              {NEWS_PAGES.map((page, pageIndex) => (
                <View key={pageIndex} style={[styles.newsPage, { width: pageWidth }]}>
                  {page.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.newsCard}
                      activeOpacity={0.85}
                      onPress={() => onPressNews?.(item.id)}
                    >
                      <LinearGradient
                        colors={[COLORS.PRIMARY_TINT, COLORS.LOGO_GRADIENT_END]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.newsThumb}
                      >
                        <NewspaperIcon size={26} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.6} />
                      </LinearGradient>
                      <Text style={styles.newsTitle} numberOfLines={3}>
                        {item.title}
                      </Text>
                      <ChevronRightIcon size={18} color={COLORS.ICON_MUTED} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.dots}>
            {NEWS_PAGES.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === newsPageIndex && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.otherSection}>
            <Text style={styles.sectionTitle}>Chức năng khác</Text>
            <View style={styles.otherGrid}>
              <FeatureGrid items={OTHER_FEATURES} isTinted={false} onPress={onPressFeature} />
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingBottom: 0 },
  scrollContent: { paddingBottom: 32 },
  blob: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 20,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  brandTitle: {
    fontFamily: FONTS.EXTRA_BOLD,
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: 0.3,
    color: COLORS.PRIMARY,
  },
  brandSubtitle: {
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.TEXT_MUTED,
  },
  featureCard: {
    marginHorizontal: SCREEN_PADDING,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleLarge: { fontFamily: FONTS.BOLD, fontSize: 20, lineHeight: 26, color: COLORS.PRIMARY },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 9999,
    backgroundColor: COLORS.PRIMARY_TINT,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20 },
  gridItem: { width: '25%', alignItems: 'center' },
  iconWrap: { width: 60, height: 60, overflow: 'visible' },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxTinted: {
    borderWidth: 1.5,
    borderColor: COLORS.TILE_BORDER,
  },
  iconBoxPlain: {
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  aiBadge: {
    position: 'absolute',
    top: -6,
    right: -7,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 1.5,
    borderColor: COLORS.SURFACE,
  },
  aiBadgeText: { fontFamily: FONTS.BOLD, fontSize: 9, lineHeight: 13, color: COLORS.SURFACE },
  gridLabel: {
    marginTop: 8,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  banner: {
    marginHorizontal: SCREEN_PADDING,
    marginTop: 20,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 14,
  },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  bannerBadgeText: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.TEXT },
  bannerTextBlock: { paddingBottom: 2 },
  bannerCaption: {
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.SURFACE,
  },
  bannerTitle: {
    fontFamily: FONTS.BOLD,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.SURFACE,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 18, lineHeight: 24, color: COLORS.PRIMARY },
  moreText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.PRIMARY_LIGHT },
  newsPager: { paddingHorizontal: SCREEN_PADDING },
  newsPage: { gap: 12, paddingTop: 2, paddingBottom: 10 },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  newsThumb: {
    width: 98,
    height: 66,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsTitle: {
    flex: 1,
    fontFamily: FONTS.BOLD,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.TEXT,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.DOT_INACTIVE },
  dotActive: { width: 24, backgroundColor: COLORS.PRIMARY_LIGHT },
  otherSection: { marginTop: 28, paddingHorizontal: SCREEN_PADDING },
  otherGrid: { marginTop: 16 },
});