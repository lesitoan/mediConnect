import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  HistoryIcon,
  ReceiptIcon,
  StethoscopeIcon,
} from '../../components/icons';
import { StethoscopeColorIcon } from '../../components/featureIcons';
import { COLORS, FONTS } from '../../constants/theme';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const NAVY = '#1F63A8';
const SKY = '#27A0E8';
const ROBOT = '#15497A';
const ONLINE_GREEN = '#19B87A';
const BUTTON_GRADIENT = ['#025C8E', '#2B72A6'] as const;

type ActionId = 'booking' | 'reschedule' | 'cancel' | 'search';

function RobotGlyph({ width }: { width: number }) {
  return (
    <Svg width={width} height={(width * 28) / 30} viewBox="9 7 30 28" fill="none">
      <Path d="M24 13V18" stroke={ROBOT} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={24} cy={11.5} r={2.3} fill={ROBOT} />
      <Rect x={11} y={22.5} width={3} height={6} rx={1.5} fill={ROBOT} />
      <Rect x={34} y={22.5} width={3} height={6} rx={1.5} fill={ROBOT} />
      <Rect x={14} y={18} width={20} height={15} rx={6} fill={ROBOT} />
      <Circle cx={20} cy={24.5} r={1.7} fill="#FFFFFF" />
      <Circle cx={28} cy={24.5} r={1.7} fill="#FFFFFF" />
      <Path d="M21.5 29Q24 31.2 26.5 29" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function HeaderAvatar() {
  return (
    <View style={styles.headerAvatar}>
      <Svg width={48} height={48} viewBox="0 0 48 48" fill="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="avatarRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D6E8F9" />
            <Stop offset="1" stopColor="#2F86D6" />
          </SvgGradient>
        </Defs>
        <Circle cx={24} cy={24} r={22} fill="#FFFFFF" stroke="url(#avatarRing)" strokeWidth={3} />
      </Svg>
      <RobotGlyph width={26} />
      <View style={styles.onlineDot} />
    </View>
  );
}

function BotAvatar() {
  return (
    <View style={styles.botAvatar}>
      <RobotGlyph width={21} />
    </View>
  );
}

function VerifiedBadge() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        fill="#1F6FB5"
        stroke="#1F6FB5"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="m9 12 2 2 4-4"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ActionRescheduleIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 48 48" fill="none">
      <Rect x={8} y={12} width={32} height={28} rx={6} stroke={NAVY} strokeWidth={3} />
      <Path d="M8 21H40M16 8V15M32 8V15" stroke={NAVY} strokeWidth={3} strokeLinecap="round" />
      <Path d="M21.4 25.6V31.6" stroke="#1E7BD6" strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={24.6} cy={31.2} r={3.4} stroke="#1E7BD6" strokeWidth={2.4} />
    </Svg>
  );
}

function ActionCancelIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 48 48" fill="none">
      <Rect x={8} y={12} width={32} height={28} rx={6} stroke={SKY} strokeWidth={3} />
      <Path d="M8 21H40M16 8V15M32 8V15" stroke={SKY} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={24} cy={31} r={6} fill="#FBD3D3" />
      <Path
        d="M21.2 28.2L26.8 33.8M26.8 28.2L21.2 33.8"
        stroke="#E5383B"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ActionSearchIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 48 48" fill="none">
      <Rect x={9} y={9} width={26} height={31} rx={5} stroke={NAVY} strokeWidth={3} />
      <Path d="M16 6V12M28 6V12" stroke={NAVY} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={21} cy={20} r={3.6} fill="#4DB1F5" />
      <Path d="M14.5 31C14.5 27.8 17 26.2 21 26.2" stroke={NAVY} strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={34} cy={33} r={7} fill="#FFFFFF" stroke={NAVY} strokeWidth={3} />
      <Path d="M34 30V36M31 33H37" stroke={NAVY} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M39.2 38.2L44 43" stroke={NAVY} strokeWidth={3.4} strokeLinecap="round" />
    </Svg>
  );
}

function MicIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
        fill="#2C3744"
        stroke="#2C3744"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"
        stroke="#2C3744"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ImagePlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 5h6M19 2v6M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
        stroke="#2C3744"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={9} r={2} stroke="#2C3744" strokeWidth={2} />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 11.2L21.5 2.8 14 21.5l-3.1-7.4L2.5 11.2Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ACTIONS: { id: ActionId; title: string; desc: string; icon: ReactNode }[] = [
  {
    id: 'booking',
    title: 'ĐẶT LỊCH KHÁM',
    desc: 'Chọn chuyên khoa, bác sĩ và\nkhung giờ',
    icon: <StethoscopeColorIcon size={32} />,
  },
  {
    id: 'reschedule',
    title: 'ĐỔI LỊCH KHÁM',
    desc: 'Thay đổi thời gian phiếu hẹn\nđã đặt',
    icon: <ActionRescheduleIcon />,
  },
  {
    id: 'cancel',
    title: 'HỦY LỊCH HẸN',
    desc: 'Hủy phiếu khám và hoàn phí',
    icon: <ActionCancelIcon />,
  },
  {
    id: 'search',
    title: 'TRA CỨU BÁC SĨ &\nCHUYÊN KHOA',
    desc: 'Tìm kiếm thông tin bác sĩ,\nbảng giá dịch vụ',
    icon: <ActionSearchIcon />,
  },
];

const QUICK_CHIPS: { id: string; label: string; icon: ReactNode }[] = [
  { id: 'general', label: 'Bác sĩ Đa khoa', icon: <StethoscopeIcon size={16} color={COLORS.PRIMARY} /> },
  { id: 'price', label: 'Tra cứu bảng giá', icon: <ReceiptIcon size={16} color={COLORS.PRIMARY} /> },
  { id: 'insurance', label: 'Hỗ trợ BHYT', icon: <HelpCircleIcon size={16} color={COLORS.PRIMARY} /> },
];

const STEPS = [
  {
    title: 'Bước 1: Chọn Chuyên khoa & Bệnh viện',
    desc: 'Hơn 30 chuyên khoa tại hệ thống MediConnect',
  },
  {
    title: 'Bước 2: Chọn Bác sĩ & Khung giờ khám',
    desc: 'Lựa chọn bác sĩ trưởng khoa hoặc giờ khám phù hợp',
  },
  {
    title: 'Bước 3: Xác nhận thông tin hồ sơ',
    desc: 'Nhận mã QR phiếu khám tức thì qua ứng dụng',
  },
];

const getTimeLabel = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `Hôm nay, ${hours}:${minutes}`;
};

type AIChatScreenProps = {
  onPressBack?: () => void;
  onPressAction?: (id: ActionId) => void;
  onPressStartBooking?: () => void;
  onPressChip?: (id: string) => void;
};

export default function AIChatScreen({
  onPressBack,
  onPressAction,
  onPressStartBooking,
  onPressChip,
}: AIChatScreenProps) {
  const [inputText, setInputText] = useState('');
  const [timeLabel] = useState(getTimeLabel);

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack} hitSlop={10}>
          <ArrowLeftIcon size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>

        <HeaderAvatar />

        <View style={styles.headerTextBlock}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>MediCare AI</Text>
            <View style={styles.verifiedBadge}>
              <VerifiedBadge />
            </View>
          </View>
          <View style={styles.headerSubRow}>
            <View style={styles.headerSubDot} />
            <Text style={styles.headerSub}>Trực tuyến 24/7</Text>
          </View>
        </View>

        <TouchableOpacity hitSlop={10}>
          <HistoryIcon size={22} color="#3A4654" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{timeLabel}</Text>
          </View>

          <View style={styles.botRow}>
            <BotAvatar />
            <View style={styles.botColumn}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>
                  Xin chào! Tôi là Trợ lý MediCare AI. Tôi có thể hỗ trợ bạn thực hiện nhanh các
                  thao tác y tế dưới đây:
                </Text>
              </View>

              <View style={styles.actionList}>
                {ACTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => onPressAction?.(item.id)}
                  >
                    <LinearGradient
                      colors={['#FFFFFF', '#EAF4FD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionCard}
                    >
                      <LinearGradient
                        colors={['#EBF5FF', '#D3E7FA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionIconBox}
                      >
                        {item.icon}
                      </LinearGradient>
                      <View style={styles.actionTextBox}>
                        <Text style={styles.actionTitle}>{item.title}</Text>
                        <Text style={styles.actionDesc}>{item.desc}</Text>
                      </View>
                      <View style={styles.chevronCircle}>
                        <ChevronRightIcon size={16} color="#1F6FB5" strokeWidth={2.4} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.userBubble}>
            <Text style={styles.userText}>Tôi muốn Đặt lịch khám mới</Text>
          </View>

          <View style={styles.botRow}>
            <BotAvatar />
            <View style={styles.botColumn}>
              <View style={[styles.bubble, styles.processBubble]}>
                <View style={styles.processBadge}>
                  <Text style={styles.processBadgeText}>QUY TRÌNH 3 BƯỚC</Text>
                </View>
                <Text style={styles.processIntro}>Bạn có thể hoàn tất đăng ký chỉ trong 1 phút:</Text>

                <View style={styles.stepper}>
                  <View style={styles.stepLine} />
                  {STEPS.map((step, index) => (
                    <View key={step.title} style={styles.stepRow}>
                      <View style={[styles.stepDot, index === 0 && styles.stepDotActive]} />
                      <Text style={[styles.stepTitle, index === 0 && styles.stepTitleActive]}>
                        {step.title}
                      </Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity activeOpacity={0.85} onPress={onPressStartBooking}>
                  <LinearGradient
                    colors={BUTTON_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.4 }}
                    style={styles.startButton}
                  >
                    <Text style={styles.startButtonText}>Bắt đầu đặt khám</Text>
                    <ArrowRightIcon />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={styles.chip}
                activeOpacity={0.8}
                onPress={() => onPressChip?.(chip.id)}
              >
                {chip.icon}
                <Text style={styles.chipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TouchableOpacity hitSlop={10}>
              <MicIcon />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Hỏi MediCare AI hoặc chọn tác vụ..."
              placeholderTextColor="#A9B8C8"
              value={inputText}
              onChangeText={setInputText}
              allowFontScaling={false}
              returnKeyType="send"
            />

            <TouchableOpacity hitSlop={10}>
              <ImagePlusIcon />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendButton} activeOpacity={0.85}>
              <SendIcon />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingLeft: 26,
    paddingRight: 28,
    paddingVertical: 10,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F8',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -9,
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ONLINE_GREEN,
    borderWidth: 2.5,
    borderColor: COLORS.SURFACE,
  },
  headerTextBlock: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 20, lineHeight: 26, color: '#0F2236' },
  verifiedBadge: { marginLeft: 52, marginTop: 3 },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerSubDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ONLINE_GREEN },
  headerSub: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, lineHeight: 18, color: ONLINE_GREEN },

  chatContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },
  dateChip: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#E8EFF9',
  },
  dateChipText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: '#3F4B5B' },

  botRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D6E8F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botColumn: { flex: 1 },
  bubble: {
    width: '92%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  bubbleText: { fontFamily: FONTS.REGULAR, fontSize: 15, lineHeight: 24, color: COLORS.TEXT },

  actionList: { width: '92%', gap: 12, marginTop: 14 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 13,
    paddingLeft: 13,
    paddingRight: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C3DDF5',
  },
  actionIconBox: {
    width: 57,
    height: 57,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9E0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextBox: { flex: 1 },
  actionTitle: { fontFamily: FONTS.SEMI_BOLD, fontSize: 15, lineHeight: 21, color: '#164E78' },
  actionDesc: {
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#5E6F82',
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userBubble: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
  userText: { fontFamily: FONTS.REGULAR, fontSize: 15, lineHeight: 22, color: COLORS.SURFACE },

  processBubble: { width: '92%' },
  processBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E0EEFB',
  },
  processBadgeText: {
    fontFamily: FONTS.BOLD,
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#1B5E94',
  },
  processIntro: {
    marginTop: 12,
    marginBottom: 18,
    fontFamily: FONTS.REGULAR,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.TEXT,
  },
  stepper: { marginBottom: 14 },
  stepLine: {
    position: 'absolute',
    left: 4,
    top: 8,
    bottom: 6,
    width: 2,
    backgroundColor: '#94CCFF',
  },
  stepRow: { paddingLeft: 22, paddingBottom: 14 },
  stepDot: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9E4EF',
  },
  stepDotActive: { backgroundColor: COLORS.PRIMARY },
  stepTitle: { fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 22, color: '#17202C' },
  stepTitleActive: { color: COLORS.PRIMARY },
  stepDesc: { fontFamily: FONTS.REGULAR, fontSize: 14, lineHeight: 21, color: '#4A5563' },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
  },
  startButtonText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 15, color: COLORS.SURFACE },

  bottomArea: {
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F8',
  },
  chipRow: { gap: 10, paddingHorizontal: 20, paddingBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#C5E1FA',
    backgroundColor: COLORS.PRIMARY_TINT,
  },
  chipText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.PRIMARY },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    marginHorizontal: 20,
    paddingLeft: 18,
    paddingRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: COLORS.PRIMARY_TINT,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontFamily: FONTS.REGULAR,
    fontSize: 14,
    color: COLORS.TEXT,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
});