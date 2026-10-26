import { useState, type ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text as RNText,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import {
  ArrowLeftIcon,
  BriefcaseMedicalIcon,
  CalendarIcon,
  HeartPulseIcon,
  QrCodeIcon,
  ReceiptIcon,
} from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';


function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}


const NAVY = '#025C8E';
const BUTTON_GRADIENT = ['#2B72A6', '#025C8E'] as const;


type PaymentMethodId = 'vnpay' | 'atm';


export type PaymentSubmitPayload = {
  recordCode: string;
  invoiceCode: string;
  method: PaymentMethodId;
  vat: boolean;
  total: number;
};


const RECORD = {
  recordCode: 'MC-0502537',
  invoiceCode: 'MC-8896-PAY',
  patientName: 'TRẦN THỊ QUỲNH',
  specialty: 'Nội Tim Mạch',
  doctorName: 'TS.BS Lê Quang Huy',
  room: 'Phòng 302, Tòa A',
  time: '08:30 • Thứ Ba, 21/10/2025',
};


const FEE_ITEMS = [
  { id: 'exam', label: 'Phí khám chuyên gia Tim mạch', amount: 300000 },
  { id: 'echo', label: 'Siêu âm tim mạch', amount: 450000 },
  { id: 'lipid', label: 'Xét nghiệm lipid máu', amount: 120000 },
];


const formatMoney = (value: number) => `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;


function WalletIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 14h.01" stroke={NAVY} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}


function BankIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10M2.5 9.5 12 3l9.5 6.5H2.5Z"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


function FileTextIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M14 2v5h5M9 13h6M9 17h6" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={4.5} y={10.5} width={15} height={10.5} rx={2.5} fill="#FFFFFF" />
      <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}


function CheckBadge() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Z"
        fill={NAVY}
      />
      <Path d="m7.8 12.3 3 3 5.4-6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


type PaymentScreenProps = {
  onPressBack?: () => void;
  onPressTerms?: () => void;
  onPressRegulation?: () => void;
  onPay?: (payload: PaymentSubmitPayload) => void;
};


export default function PaymentScreen({
  onPressBack,
  onPressTerms,
  onPressRegulation,
  onPay,
}: PaymentScreenProps) {
  const [method, setMethod] = useState<PaymentMethodId>('vnpay');
  const [vat, setVat] = useState(false);


  const total = FEE_ITEMS.reduce((sum, item) => sum + item.amount, 0);


  const methods: { id: PaymentMethodId; label: string; icon: ReactNode }[] = [
    { id: 'vnpay', label: 'VNPAY-QR', icon: <QrCodeIcon size={26} color={NAVY} /> },
    { id: 'atm', label: 'Thẻ ATM (Napas247)', icon: <BankIcon /> },
  ];


  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack} hitSlop={10}>
          <ArrowLeftIcon size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Thanh toán sau khám</Text>
          <Text style={styles.headerSub}>Mã hồ sơ: {RECORD.recordCode} • Sau khám</Text>
        </View>
      </View>


      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <LinearGradient
            colors={['#7CC4F5', '#025C8E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopLine}
          />
          <View style={styles.cardBody}>
            <View style={styles.patientRow}>
              <View style={styles.flex}>
                <Text style={styles.patientName}>{RECORD.patientName}</Text>
                <Text style={styles.patientCode}>Mã BN: {RECORD.recordCode}</Text>
              </View>
              <View style={styles.patientIcon}>
                <BriefcaseMedicalIcon size={22} color={NAVY} />
              </View>
            </View>
            <View style={styles.divider} />


            <View style={styles.doctorRow}>
              <View style={styles.doctorIcon}>
                <HeartPulseIcon size={26} color={NAVY} />
              </View>
              <View style={styles.doctorInfo}>
                <View style={styles.doctorTopRow}>
                  <Text style={styles.specialty}>{RECORD.specialty}</Text>
                  <View style={styles.codeTag}>
                    <Text style={styles.codeTagText}>#{RECORD.invoiceCode}</Text>
                  </View>
                </View>
                <Text style={styles.doctorName}>{RECORD.doctorName}</Text>
                <Text style={styles.room}>{RECORD.room}</Text>
              </View>
            </View>


            <View style={styles.timeBox}>
              <CalendarIcon size={18} color={NAVY} />
              <Text style={styles.timeText}>{RECORD.time}</Text>
            </View>
          </View>
        </View>


        <View style={[styles.card, styles.sectionCard]}>
          <View style={styles.sectionTitleRow}>
            <ReceiptIcon size={22} color={NAVY} />
            <Text style={styles.sectionTitle}>Chi tiết viện phí</Text>
          </View>
          <View style={styles.divider} />


          <View style={styles.feeList}>
            {FEE_ITEMS.map((item) => (
              <View key={item.id} style={styles.feeRow}>
                <Text style={styles.feeLabel}>{item.label}</Text>
                <Text style={styles.feeAmount}>{formatMoney(item.amount)}</Text>
              </View>
            ))}
          </View>


          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Tổng viện phí cần thanh toán</Text>
            <Text style={styles.totalValue}>{formatMoney(total)}</Text>
          </View>
        </View>


        <View style={[styles.card, styles.sectionCard]}>
          <View style={styles.sectionTitleRow}>
            <WalletIcon />
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          </View>
          <View style={styles.divider} />


          <View style={styles.methodList}>
            {methods.map((item) => {
              const active = item.id === method;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={[styles.methodCard, active && styles.methodCardActive]}
                  onPress={() => setMethod(item.id)}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={styles.methodIcon}>{item.icon}</View>
                  <Text style={styles.methodLabel}>{item.label}</Text>
                  {active ? <CheckBadge /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>


        <View style={[styles.card, styles.vatCard]}>
          <FileTextIcon />
          <View style={styles.vatText}>
            <Text style={styles.vatTitle}>Xuất hóa đơn điện tử (VAT)</Text>
            <Text style={styles.vatDesc}>Gửi trực tiếp qua email trong 24 giờ</Text>
          </View>
          <Switch
            value={vat}
            onValueChange={setVat}
            trackColor={{ false: '#DCE6F2', true: NAVY }}
            thumbColor="#FFFFFF"
          />
        </View>


        <Text style={styles.terms}>
          Bằng việc bấm xác nhận thanh toán, bạn đồng ý với{'\n'}
          <Text style={styles.termsLink} onPress={onPressTerms}>
            Điều khoản dịch vụ
          </Text>
          {'\n'}và{' '}
          <Text style={styles.termsLink} onPress={onPressRegulation}>
            Quy chế khám chữa bệnh
          </Text>{' '}
          của{'\n'}MediConnect.
        </Text>
      </ScrollView>


      <View style={styles.bottomBar}>
        <Text style={styles.bottomLabel}>Tổng thanh toán:</Text>
        <Text style={styles.bottomTotal}>{formatMoney(total)}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            onPay?.({
              recordCode: RECORD.recordCode,
              invoiceCode: RECORD.invoiceCode,
              method,
              vat,
              total,
            })
          }
        >
          <LinearGradient
            colors={BUTTON_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.4 }}
            style={styles.payButton}
          >
            <LockIcon />
            <Text style={styles.payButtonText}>THANH TOÁN {formatMoney(total)}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: COLORS.BACKGROUND },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F8',
  },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 19, lineHeight: 26, color: NAVY },
  headerSub: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12.5, lineHeight: 17, color: '#4A5563' },


  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E6F4',
    backgroundColor: COLORS.SURFACE,
    overflow: 'hidden',
  },
  cardTopLine: { height: 5 },
  cardBody: { padding: 16, gap: 14 },
  divider: { height: 1, backgroundColor: '#E6EEF8' },


  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientName: { fontFamily: FONTS.BOLD, fontSize: 22, lineHeight: 30, color: '#0F2236' },
  patientCode: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: '#4A5563' },
  patientIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },


  doctorRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  doctorIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E0EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1, gap: 2 },
  doctorTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  specialty: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: NAVY },
  codeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E6EEF6',
  },
  codeTagText: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 11.5,
    letterSpacing: 0.3,
    color: '#3F4B5B',
  },
  doctorName: { fontFamily: FONTS.BOLD, fontSize: 18, lineHeight: 25, color: '#0F2236' },
  room: { fontFamily: FONTS.REGULAR, fontSize: 14, color: '#4A5563' },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: '#EDF5FC',
  },
  timeText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: NAVY },


  sectionCard: { padding: 16, gap: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 20, color: '#0F2236' },


  feeList: { gap: 14 },
  feeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  feeLabel: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 15, color: '#2C3744' },
  feeAmount: { fontFamily: FONTS.BOLD, fontSize: 15, color: '#0F2236' },
  totalBox: {
    gap: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: '#EAF4FD',
  },
  totalLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13.5, color: NAVY },
  totalValue: { fontFamily: FONTS.BOLD, fontSize: 28, lineHeight: 36, color: NAVY },


  methodList: { gap: 10 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E6EEF8',
    backgroundColor: COLORS.SURFACE,
  },
  methodCardActive: { borderColor: NAVY, backgroundColor: '#F6FBFF' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B8C7D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: NAVY },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: NAVY },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0EAF5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { flex: 1, fontFamily: FONTS.BOLD, fontSize: 16, color: '#0F2236' },


  vatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  vatText: { flex: 1 },
  vatTitle: { fontFamily: FONTS.BOLD, fontSize: 17, lineHeight: 24, color: '#0F2236' },
  vatDesc: { fontFamily: FONTS.REGULAR, fontSize: 13, color: '#4A5563' },


  terms: {
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 12.5,
    lineHeight: 22,
    color: '#6B7A8C',
    paddingHorizontal: 12,
  },
  termsLink: {
    fontFamily: FONTS.BOLD,
    color: NAVY,
    textDecorationLine: 'underline',
  },


  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F8',
  },
  bottomLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: '#4A5563' },
  bottomTotal: { fontFamily: FONTS.BOLD, fontSize: 28, lineHeight: 36, color: NAVY, marginBottom: 10 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 14,
  },
  payButtonText: { fontFamily: FONTS.BOLD, fontSize: 17, letterSpacing: 0.3, color: '#FFFFFF' },
});

