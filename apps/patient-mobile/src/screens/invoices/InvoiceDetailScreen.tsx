import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import { ArrowLeftIcon, ChevronRightIcon, type IconProps } from '../../components/icons';
import { DownloadIcon } from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import { formatIssuedDate, getInvoiceById, type Invoice } from '../../services/invoiceService';

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

const ShareIcon = createIcon(() => (
  <>
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
  </>
));

const MailIcon = createIcon(() => (
  <>
    <Path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </>
));

const CheckIcon = createIcon(() => <Path d="M20 6 9 17l-5-5" />);

function BannerCheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={11} fill="#5ED393" />
      <Path
        d="m7.5 12.5 3 3 6-6.5"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldFilledIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        fill="#FFFFFF"
      />
      <Path
        d="m9 12 2 2 4-4"
        stroke="#2D74A8"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const PAGE_BG = '#F0F6FA';
const SUCCESS = '#19A06C';
const WARNING = '#B7791F';
const SERIF = Platform.select<string>({ ios: 'Times New Roman', default: 'serif' });
const MONO = Platform.select<string>({ ios: 'Courier', default: 'monospace' });

const MOCK_PATIENT = {
  name: 'TRẦN THỊ QUỲNH',
  birthYear: 1995,
  code: 'MC-0502537',
  address: 'Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
};
const MOCK_DEPARTMENT = 'Khoa Nội Tim Mạch & Can Thiệp';
const PAYMENT_TYPE_LABEL = 'Thanh toán viện phí dịch vụ';
const EINVOICE_URL = 'https://hoadondientu.gdt.gov.vn';

type InvoiceItem = {
  name: string;
  note: string;
  amount: number;
};

type InvoiceWithItems = Invoice & { items?: InvoiceItem[] };

const formatNumber = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const showComingSoon = () => Alert.alert('Thông báo', 'Chức năng đang được phát triển');

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const GROUP_UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];

const readGroup = (value: number, hasHigherGroup: boolean) => {
  const hundred = Math.floor(value / 100);
  const ten = Math.floor((value % 100) / 10);
  const unit = value % 10;
  const parts: string[] = [];
  if (hundred > 0 || hasHigherGroup) parts.push(`${DIGITS[hundred]} trăm`);
  if (ten > 1) {
    parts.push(`${DIGITS[ten]} mươi`);
  } else if (ten === 1) {
    parts.push('mười');
  } else if (unit > 0 && (hundred > 0 || hasHigherGroup)) {
    parts.push('lẻ');
  }
  if (unit > 0) {
    if (ten >= 1 && unit === 5) parts.push('lăm');
    else if (ten > 1 && unit === 1) parts.push('mốt');
    else parts.push(DIGITS[unit]);
  }
  return parts.join(' ');
};

const amountToWords = (amount: number) => {
  if (amount <= 0) return 'Không đồng';
  const groups: number[] = [];
  let rest = Math.floor(amount);
  while (rest > 0) {
    groups.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  const words: string[] = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const value = groups[index];
    if (value === 0) continue;
    const hasHigherGroup = index < groups.length - 1;
    words.push(`${readGroup(value, hasHigherGroup)} ${GROUP_UNITS[index]}`.trim());
  }
  const sentence = `${words.join(' ')} đồng chẵn`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
};

const parseIssuedDate = (text: string) => {
  const match = /(\d{1,2})\D+(\d{1,2})\D+(\d{4})/.exec(text);
  if (!match) return null;
  return { day: match[1].padStart(2, '0'), month: match[2].padStart(2, '0'), year: match[3] };
};

const QR_GRID = 21;

const buildQrPath = (seed: string) => {
  let state = 7;
  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) % 2147483647;
  }
  const next = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
  const isFinderZone = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > QR_GRID - 9 && y < 8) || (x < 8 && y > QR_GRID - 9);
  const isFinderDark = (dx: number, dy: number) =>
    dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);

  const cells: string[] = [];
  const addCell = (x: number, y: number) => cells.push(`M${x} ${y}h1v1h-1z`);

  [
    [0, 0],
    [QR_GRID - 7, 0],
    [0, QR_GRID - 7],
  ].forEach(([originX, originY]) => {
    for (let dy = 0; dy < 7; dy += 1) {
      for (let dx = 0; dx < 7; dx += 1) {
        if (isFinderDark(dx, dy)) addCell(originX + dx, originY + dy);
      }
    }
  });

  for (let y = 0; y < QR_GRID; y += 1) {
    for (let x = 0; x < QR_GRID; x += 1) {
      const isCenter = x >= 8 && x <= 12 && y >= 8 && y <= 12;
      if (isFinderZone(x, y) || isCenter) continue;
      if (next() > 0.55) addCell(x, y);
    }
  }
  return cells.join('');
};

function QrCode({ seed }: { seed: string }) {
  const path = useMemo(() => buildQrPath(seed || 'MEDICONNECT'), [seed]);

  return (
    <Svg width={58} height={58} viewBox={`0 0 ${QR_GRID} ${QR_GRID}`}>
      <Path d={path} fill="#111827" />
      <Circle cx={10.5} cy={10.5} r={3.3} fill="#FFFFFF" />
      <Circle cx={10.5} cy={10.5} r={2.6} fill="none" stroke="#E5383B" strokeWidth={0.35} />
      <Path
        d="M10.5 9.2v2.6M9.2 10.5h2.6"
        stroke="#E5383B"
        strokeWidth={0.45}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function DashedLine() {
  return (
    <View style={styles.dashedClip}>
      <View style={styles.dashedInner} />
    </View>
  );
}

type InvoiceDetailScreenProps = {
  invoiceId: string;
  onPressBack?: () => void;
};

export default function InvoiceDetailScreen({ invoiceId, onPressBack }: InvoiceDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    getInvoiceById(invoiceId)
      .then((data) => {
        if (isActive) setInvoice(data);
      })
      .catch(() => {
        if (isActive) setInvoice(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [invoiceId]);

  const openEInvoicePortal = () => {
    Linking.openURL(EINVOICE_URL).catch(() => showComingSoon());
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
        </View>
      );
    }

    if (!invoice) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Không tìm thấy hóa đơn.</Text>
        </View>
      );
    }

    const isVatIssued = invoice.vatStatus === 'ISSUED';
    const issuedDateText = formatIssuedDate(invoice.issuedAt);
    const issuedDate = parseIssuedDate(issuedDateText);
    const items: InvoiceItem[] = invoice.items ?? [
      {
        name: invoice.serviceName,
        note: `${invoice.doctorName} - ${invoice.location}`,
        amount: invoice.amount,
      },
    ];
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = 0;
    const payableAmount = totalAmount - discountAmount;
    const reasonText = `${items
      .map((item) => `${item.name} (${formatNumber(item.amount)})`)
      .join('; ')};`;
    const serial = invoice.code.replace(/\D/g, '').slice(-8);
    const uuid = issuedDate
      ? `${issuedDate.year}${issuedDate.month}${issuedDate.day}-${serial.slice(0, 4)}-MCDC-${MOCK_PATIENT.code.replace(/\D/g, '')}`
      : `${serial}-MCDC-${MOCK_PATIENT.code.replace(/\D/g, '')}`;

    return (
      <>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.paper}>
            <LinearGradient
              colors={['#1884BC', '#1A5B83']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paperAccent}
            />

            <View style={styles.hospitalRow}>
              <View style={styles.hospitalText}>
                <Text style={styles.hospitalSystem}>HỆ THỐNG Y TẾ KỸ THUẬT CAO</Text>
                <Text style={styles.hospitalName}>BV ĐA KHOA QUỐC TẾ</Text>
                <Text style={styles.hospitalName}>MEDICONNECT</Text>
                <Text style={styles.hospitalPortal}>Cổng thông tin & Bệnh án điện tử EMR</Text>
              </View>
              <View style={styles.qrBox}>
                <QrCode seed={invoice.code} />
              </View>
            </View>

            <View style={styles.heavyRule} />

            <Text style={styles.paperTitle}>HÓA ĐƠN THANH TOÁN</Text>
            <Text style={styles.paperSubtitle}>Theo khung giá Bộ Y Tế ban hành</Text>
            <Text style={styles.paperDate}>
              {issuedDate
                ? `Ngày ${Number(issuedDate.day)} tháng ${Number(issuedDate.month)} năm ${issuedDate.year}`
                : issuedDateText}
            </Text>

            <Text style={[styles.field, styles.fieldFirst]}>
              <Text style={styles.fieldLabel}>.Mã tra cứu: </Text>
              <Text style={styles.mono}>#{invoice.code}</Text>
            </Text>

            <View style={styles.thinRule} />

            <View style={styles.patientRow}>
              <Text style={styles.patientText}>
                <Text style={styles.fieldLabel}>
                  .Bệnh nhân: {MOCK_PATIENT.name} 
                </Text>
              </Text>
              <View style={styles.stamp}>
                <Text style={styles.stampText}>[{MOCK_PATIENT.code}]</Text>
              </View>
            </View>

            <Text style={styles.field}>
              <Text style={styles.fieldLabel}>.Địa chỉ: </Text>
              {MOCK_PATIENT.address}
            </Text>

            <Text style={styles.field}>
              <Text style={styles.fieldLabel}>.Khoa: {MOCK_DEPARTMENT}</Text>
            </Text>

            <Text style={styles.field}>
              <Text style={styles.fieldLabel}>.Lý Do: </Text>
              {reasonText}
            </Text>

            <View style={styles.perforation}>
              <View style={[styles.notch, styles.notchLeft]} />
              <View style={styles.perforationLine}>
                <DashedLine />
              </View>
              <View style={[styles.notch, styles.notchRight]} />
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountText}>
                <Text style={styles.fieldLabel}>.Số Tiền: </Text>
                <Text style={styles.amountValue}>{formatNumber(payableAmount)} đ</Text>
              </Text>
              <View style={styles.paymentPill}>
                <Text style={styles.paymentPillText}>{PAYMENT_TYPE_LABEL}</Text>
              </View>
            </View>

            <Text style={[styles.field, styles.wordsField]}>
              <Text style={styles.fieldLabel}>.Bằng chữ: </Text>
              <Text style={styles.italic}>{amountToWords(payableAmount)}</Text>
            </Text>

            <View style={styles.thinRuleSpaced} />

            <View style={styles.footerRow}>
              <View style={styles.footerLeft}>
                <Text style={styles.footerText}>Hóa đơn điện tử khởi tạo từ máy tính tiền</Text>
                <Text style={styles.footerMono}>UUID: {uuid}</Text>
              </View>
              <View style={styles.footerRight}>
                <View style={styles.signatureRow}>
                  {isVatIssued && <CheckIcon size={13} color={SUCCESS} strokeWidth={2.6} />}
                  <Text style={[styles.signatureText, { color: isVatIssued ? SUCCESS : WARNING }]}>
                    {isVatIssued ? 'Chữ ký số hợp lệ' : 'Chờ ký số'}
                  </Text>
                </View>
                {isVatIssued && (
                  <Text style={styles.footerTextRight}>
                    BV ĐKQT MediConnect - Ký ngày {issuedDateText}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.tearLine}>
              <DashedLine />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>CHI TIẾT VIỆN PHÍ THỰC TẾ</Text>
              <TouchableOpacity hitSlop={8} onPress={showComingSoon}>
                <Text style={styles.cardLink}>XEM BIỂU MẪU 01/BV</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={`${item.name}-${index}`}>
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemNote}>{item.note}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemAmount}>{formatNumber(item.amount)} đ</Text>
                    <Text style={styles.itemNote}>Đơn giá dịch vụ</Text>
                  </View>
                </View>
                <View style={styles.itemDivider} />
              </View>
            ))}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng chi phí viện phí:</Text>
              <Text style={styles.summaryValue}>{formatNumber(totalAmount)} đ</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Miễn giảm / BHYT chi trả:</Text>
              <Text style={styles.summaryValue}>{formatNumber(discountAmount)} đ</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.payableRow}>
              <Text style={styles.payableLabel}>Người bệnh thực trả:</Text>
              <Text style={styles.payableValue}>{formatNumber(payableAmount)} đ</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <ShieldFilledIcon />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Quy chuẩn Hóa đơn điện tử</Text>
              <Text style={styles.infoBody}>
                Hóa đơn khởi tạo theo chuẩn Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC của
                Tổng cục Thuế.
              </Text>
              <TouchableOpacity style={styles.infoLinkRow} hitSlop={8} onPress={openEInvoicePortal}>
                <Text style={styles.infoLink}>Tra cứu tại hoadondientu.gdt.gov.vn</Text>
                <ChevronRightIcon size={14} color="#1F5F93" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.emailButton} activeOpacity={0.85} onPress={showComingSoon}>
            <MailIcon size={18} color="#1E4F7B" />
            <Text style={styles.emailText}>Gửi về Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfButton} activeOpacity={0.85} onPress={showComingSoon}>
            <DownloadIcon size={18} color={COLORS.SURFACE} />
            <Text style={styles.pdfText}>Tải file VAT (PDF)</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack} hitSlop={10}>
          <ArrowLeftIcon size={24} color="#243B53" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chi tiết Hóa đơn thanh toán
          </Text>
          <View style={styles.headerSubRow}>
            <View style={styles.headerDot} />
            <Text style={styles.headerSub} numberOfLines={1}>
              {invoice && invoice.vatStatus !== 'ISSUED'
                ? 'Đã thanh toán • Chờ xuất hóa đơn VAT'
                : 'Đã thanh toán & Xuất điện tử'}
            </Text>
          </View>
        </View>
        <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
          <DownloadIcon size={22} color="#2F4257" />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={10} onPress={showComingSoon}>
          <ShareIcon size={22} color="#2F4257" />
        </TouchableOpacity>
      </View>

      {invoice && (
        <LinearGradient
          colors={['#235D87', '#2D70A1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          <BannerCheckIcon />
          <Text style={styles.bannerText} numberOfLines={1}>
            Mã số tiếp nhận: <Text style={styles.bannerCode}>{MOCK_PATIENT.code}</Text>
          </Text>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillText}>THEO GIÁ BYT</Text>
          </View>
        </LinearGradient>
      )}

      {renderBody()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: PAGE_BG, paddingBottom: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyText: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingLeft: 14,
    paddingRight: 22,
    paddingVertical: 10,
    backgroundColor: COLORS.SURFACE,
  },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 16, lineHeight: 22, color: '#14253A' },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#19B87A' },
  headerSub: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 11.5, color: '#6B7A8C' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  bannerText: {
    flex: 1,
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  bannerCode: {
    fontFamily: FONTS.BOLD,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  bannerPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bannerPillText: { fontFamily: FONTS.BOLD, fontSize: 11, letterSpacing: 0.3, color: '#FFFFFF' },

  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, gap: 14 },

  paper: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.SURFACE,
    shadowColor: '#1A5B83',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  paperAccent: {
    height: 6,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  hospitalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hospitalText: { flex: 1 },
  hospitalSystem: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 18,
    color: '#1D5C8E',
  },
  hospitalName: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 22,
    color: '#16222E',
  },
  hospitalPortal: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 10.5,
    lineHeight: 15,
    color: '#6B7A8C',
  },
  qrBox: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE5EE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
  },
  heavyRule: { height: 2, marginTop: 14, backgroundColor: '#16222E' },
  paperTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
    fontSize: 18,
    lineHeight: 24,
    color: '#0F1A26',
  },
  paperSubtitle: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 12.5,
    color: '#16222E',
  },
  paperDate: {
    marginTop: 2,
    textAlign: 'center',
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 12.5,
    color: '#4A5663',
  },
  field: {
    marginTop: 12,
    fontFamily: SERIF,
    fontSize: 14,
    lineHeight: 21,
    color: '#2B3440',
  },
  fieldFirst: { marginTop: 16 },
  fieldLabel: { fontFamily: SERIF, fontWeight: '700', color: '#16222E' },
  mono: { fontFamily: MONO, fontWeight: '700', fontSize: 13.5, color: '#16222E' },
  italic: { fontFamily: SERIF, fontStyle: 'italic', color: '#2B3440' },
  thinRule: { height: 1, marginTop: 10, backgroundColor: '#E6ECF2' },
  thinRuleSpaced: { height: 1, marginTop: 14, backgroundColor: '#E6ECF2' },
  patientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  patientText: { flexShrink: 1, fontFamily: SERIF, fontSize: 14, lineHeight: 21 },
  stamp: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#E03A3A',
    backgroundColor: '#FFF6F6',
  },
  stampText: { fontFamily: MONO, fontWeight: '700', fontSize: 13, color: '#16222E' },

  perforation: {
    height: 24,
    marginTop: 16,
    marginHorizontal: -16,
    justifyContent: 'center',
  },
  perforationLine: { marginHorizontal: 30 },
  notch: {
    position: 'absolute',
    top: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DCE5EE',
    backgroundColor: '#E9EFF6',
  },
  notchLeft: { left: 4 },
  notchRight: { right: 4 },
  dashedClip: { height: 1, overflow: 'hidden' },
  dashedInner: {
    height: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D3DCE6',
    borderRadius: 1,
  },

  amountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
  },
  amountText: { flexShrink: 1, fontFamily: SERIF, fontSize: 14 },
  amountValue: { fontFamily: FONTS.BOLD, fontSize: 20, color: '#0F1A26' },
  paymentPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
  },
  paymentPillText: { fontFamily: FONTS.BOLD, fontSize: 11.5, color: '#0F7A55' },
  wordsField: { marginTop: 14 },

  footerRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  footerLeft: { flex: 1 },
  footerRight: { flex: 1, alignItems: 'flex-end' },
  footerText: { fontFamily: FONTS.REGULAR, fontSize: 11, lineHeight: 17, color: '#7A8898' },
  footerMono: { marginTop: 2, fontFamily: MONO, fontSize: 10.5, lineHeight: 16, color: '#9AA7B6' },
  footerTextRight: {
    marginTop: 4,
    textAlign: 'right',
    fontFamily: FONTS.REGULAR,
    fontSize: 11,
    lineHeight: 17,
    color: '#7A8898',
  },
  signatureRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  signatureText: { fontFamily: FONTS.BOLD, fontSize: 12 },
  tearLine: { marginTop: 14 },

  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: '#1A5B83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: { fontFamily: FONTS.BOLD, fontSize: 12, letterSpacing: 0.4, color: '#566A82' },
  cardLink: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, letterSpacing: 0.3, color: '#2F6B9A' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemLeft: { flex: 1 },
  itemRight: { alignItems: 'flex-end' },
  itemName: { fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 20, color: '#17202C' },
  itemAmount: { fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 20, color: '#17202C' },
  itemNote: { marginTop: 1, fontFamily: FONTS.REGULAR, fontSize: 11.5, lineHeight: 17, color: '#98A6B8' },
  itemDivider: { height: 1, marginVertical: 12, backgroundColor: '#EEF2F6' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { fontFamily: FONTS.REGULAR, fontSize: 14, color: '#4A5868' },
  summaryValue: { fontFamily: FONTS.REGULAR, fontSize: 14, color: '#17202C' },
  summaryDivider: { height: 1, marginVertical: 10, backgroundColor: '#E1E8EF' },
  payableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payableLabel: { fontFamily: FONTS.BOLD, fontSize: 15, color: '#17202C' },
  payableValue: { fontFamily: FONTS.BOLD, fontSize: 20, color: '#265F96' },

  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C9DFF2',
    backgroundColor: '#EEF6FD',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2D74A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoTitle: { fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 20, color: '#1B2D40' },
  infoBody: {
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    lineHeight: 20,
    color: '#3F4D5C',
  },
  infoLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  infoLink: { fontFamily: FONTS.BOLD, fontSize: 13, color: '#1F5F93' },

  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#E3EAF1',
  },
  emailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#2D74A8',
    backgroundColor: COLORS.SURFACE,
  },
  emailText: { fontFamily: FONTS.BOLD, fontSize: 14, color: '#1E4F7B' },
  pdfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2D74A8',
    shadowColor: '#1A5B83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  pdfText: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.SURFACE },
});