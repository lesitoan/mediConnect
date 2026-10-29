import { useState } from 'react';
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
import { ArrowLeftIcon, HistoryIcon, StethoscopeIcon } from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';


function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}


const NAVY = '#1F63A8';
const ROBOT = '#15497A';
const ONLINE_GREEN = '#19B87A';
const SUCCESS_BG = '#E3F6EE';
const DANGER = '#D92D2D';
const DANGER_SOFT = '#FDEDED';
const DANGER_BORDER = '#F3B8B8';
const WARN_ICON = '#E08A00';


const CURRENT_APPOINTMENT = {
  id: 'apt-001',
  code: 'MC-8896-HUY',
  doctorName: 'TS.BS Lê Quang Huy',
  specialty: 'Tim mạch',
  time: '08:30 21/10/2025',
  deposit: '300.000 đ',
};


const CANCEL_REASONS = [
  { id: 'busy', label: 'Bận công tác' },
  { id: 'better', label: 'Đã đỡ bệnh' },
  { id: 'hospital', label: 'Đổi BV khác' },
  { id: 'doctor', label: 'Đổi BS khác' },
  { id: 'other', label: 'Khác' },
];


const QUICK_CHIPS = [
  { id: 'refund', label: 'Chính sách hoàn phí' },
  { id: 'policy', label: 'Quy định hủy hẹn' },
  { id: 'rebook', label: 'Đặt lại lịch khám' },
];


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
          <SvgGradient id="cancelAvatarRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D6E8F9" />
            <Stop offset="1" stopColor="#2F86D6" />
          </SvgGradient>
        </Defs>
        <Circle cx={24} cy={24} r={22} fill="#FFFFFF" stroke="url(#cancelAvatarRing)" strokeWidth={3} />
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
      <Path d="m9 12 2 2 4-4" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function CheckCircleIcon({ size = 14, color = ONLINE_GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path d="m8 12.2 2.8 2.8L16 9.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function DoubleCheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="m2 12.5 4 4L14 8M10 15.5l1 1L20 8"
        stroke="#2F86D6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


function CalendarXIcon({ color = DANGER }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15.5} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M3.5 10H20.5M8 3V7M16 3V7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="m10 13.5 4 4M14 13.5l-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}


function ClipboardCheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={4.5} y={4.5} width={15} height={17} rx={3} stroke={NAVY} strokeWidth={2} />
      <Path d="M9 4.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5" stroke={NAVY} strokeWidth={2} />
      <Path d="m9 13 2.2 2.2L15.5 11" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function WarningIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5 2.5 20h19L12 3.5Z"
        fill={WARN_ICON}
        stroke={WARN_ICON}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M12 10v4.5" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={17.3} r={1.1} fill="#FFFFFF" />
    </Svg>
  );
}


function XCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke="#FFFFFF" strokeWidth={2} />
      <Path d="m9 9 6 6M15 9l-6 6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}


function RescheduleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3M3.5 4v4.5H8M12 7.5V12l3 2"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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


const getTimeLabel = () => {
  const now = new Date();
  return `Hôm nay, ${now.getDate()} Tháng ${now.getMonth() + 1}`;
};


const getSentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `hours:{minutes}`;
};


type AICancelScreenProps = {
  onPressBack?: () => void;
  onPressSelectCancel?: (appointmentId: string, appointmentCode: string) => void;
  onPressConfirmCancel?: (appointmentId: string, appointmentCode: string, reasonId: string | null) => void;
  onPressReschedule?: (appointmentId: string) => void;
  onPressChip?: (id: string) => void;
};


export default function AICancelScreen({
  onPressBack,
  onPressSelectCancel,
  onPressConfirmCancel,
  onPressReschedule,
  onPressChip,
}: AICancelScreenProps) {
  const [inputText, setInputText] = useState('');
  const [timeLabel] = useState(getTimeLabel);
  const [sentTime] = useState(getSentTime);
  const [reasonId, setReasonId] = useState<string | null>(null);


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


          <View style={styles.userBubble}>
            <Text style={styles.userText}>
              Tôi muốn hủy lịch hẹn khám của TS.BS Lê Quang Huy vào sáng Thứ Ba (21/10). AI hướng
              dẫn tôi cách hủy và chính sách hoàn phí với.
            </Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userTime}>{sentTime}</Text>
            <DoubleCheckIcon />
          </View>


          <View style={styles.botRow}>
            <BotAvatar />
            <View style={styles.botColumn}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>
                  Dạ <Text style={styles.bubbleLink}>MediCare AI</Text> đã tìm thấy lịch hẹn của bạn
                  tại <Text style={styles.bubbleLink}>Khoa Nội Tim Mạch</Text>. Bạn có thể tiến hành
                  hủy lịch nhanh chóng với các thông tin chi tiết dưới đây:
                </Text>
              </View>
            </View>
          </View>


          <View style={styles.currentCard}>
            <LinearGradient
              colors={['#7CC4F5', '#2B72A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.currentCardTopLine}
            />
            <View style={styles.currentCardBody}>
              <View style={styles.currentHeaderRow}>
                <Text style={styles.currentLabel}>
                  MÃ PHIẾU: <Text style={styles.currentCode}>#{CURRENT_APPOINTMENT.code}</Text>
                </Text>
                <View style={styles.confirmedBadge}>
                  <CheckCircleIcon />
                  <Text style={styles.confirmedText}>Đã xác nhận</Text>
                </View>
              </View>


              <View style={styles.doctorRow}>
                <View style={styles.doctorAvatar}>
                  <StethoscopeIcon size={26} color={COLORS.PRIMARY} />
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{CURRENT_APPOINTMENT.doctorName}</Text>
                  <Text style={styles.specialtyText}>Chuyên khoa {CURRENT_APPOINTMENT.specialty}</Text>
                </View>
              </View>


              <View style={styles.detailBox}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Thời gian hẹn</Text>
                  <View style={styles.detailValueRow}>
                    <CalendarXIcon color={NAVY} />
                    <Text style={styles.detailValue}>{CURRENT_APPOINTMENT.time}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Tạm ứng dịch vụ</Text>
                  <Text style={styles.detailMoney}>{CURRENT_APPOINTMENT.deposit}</Text>
                </View>
              </View>


              <TouchableOpacity
                style={styles.dangerOutlineButton}
                activeOpacity={0.8}
                onPress={() =>
                  onPressSelectCancel?.(CURRENT_APPOINTMENT.id, CURRENT_APPOINTMENT.code)
                }
              >
                <CalendarXIcon />
                <Text style={styles.dangerOutlineText}>Chọn hủy lịch này</Text>
              </TouchableOpacity>
            </View>
          </View>


          <View style={styles.processCard}>
            <View style={styles.sectionTitleRow}>
              <ClipboardCheckIcon />
              <Text style={styles.sectionTitle}>Quy trình 3 bước & Hoàn phí</Text>
            </View>


            <View style={styles.stepper}>
              <View style={styles.stepLine} />


              <View style={styles.stepRow}>
                <View style={[styles.stepDot, styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Chọn lý do hủy hẹn</Text>
                  <View style={styles.reasonWrap}>
                    {CANCEL_REASONS.map((reason) => {
                      const active = reason.id === reasonId;
                      return (
                        <TouchableOpacity
                          key={reason.id}
                          activeOpacity={0.8}
                          style={[styles.reasonChip, active && styles.reasonChipActive]}
                          onPress={() => setReasonId(active ? null : reason.id)}
                        >
                          <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                            {reason.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>


              <View style={styles.stepRow}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepDotText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <View style={styles.stepTitleRow}>
                    <Text style={styles.stepTitle}>Chính sách hoàn tiền 100%</Text>
                    <View style={styles.stepTag}>
                      <Text style={styles.stepTagText}>Miễn phí phạt</Text>
                    </View>
                  </View>
                  <Text style={styles.stepDesc}>
                    Hủy trước giờ khám &gt; 02 tiếng được{' '}
                    <Text style={styles.stepDescStrong}>
                      hoàn trả 100% ({CURRENT_APPOINTMENT.deposit.replace(' đ', '')} đ)
                    </Text>{' '}
                    vào tài khoản thanh toán ban đầu trong 24h làm việc.
                  </Text>
                </View>
              </View>


              <View style={[styles.stepRow, styles.stepRowLast]}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepDotText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Xác nhận & Nhận thông báo</Text>
                  <Text style={styles.stepDesc}>
                    Nhận mã biên nhận hủy qua SMS & ứng dụng ngay lập tức.
                  </Text>
                </View>
              </View>
            </View>
          </View>


          <View style={styles.warnBox}>
            <WarningIcon />
            <Text style={styles.warnText}>
              <Text style={styles.warnStrong}>Lưu ý: </Text>
              Sau khi hủy, khung giờ khám này sẽ được mở lại cho bệnh nhân khác. Nếu cần đổi sang
              ngày khác, bạn có thể chọn <Text style={styles.warnStrong}>Đổi lịch</Text> để giữ
              nguyên hồ sơ.
            </Text>
          </View>


          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.dangerButton}
            onPress={() =>
              onPressConfirmCancel?.(CURRENT_APPOINTMENT.id, CURRENT_APPOINTMENT.code, reasonId)
            }
          >
            <XCircleIcon />
            <Text style={styles.dangerButtonText}>XÁC NHẬN YÊU CẦU HỦY LỊCH</Text>
          </TouchableOpacity>


          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.rescheduleButton}
            onPress={() => onPressReschedule?.(CURRENT_APPOINTMENT.id)}
          >
            <RescheduleIcon />
            <Text style={styles.rescheduleButtonText}>Đổi sang lịch khác thay vì hủy</Text>
          </TouchableOpacity>


          <Text style={styles.footnote}>{sentTime} • MediCare AI đã xác minh thông tin</Text>
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


  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: '#0B4F7E',
  },
  userText: { fontFamily: FONTS.REGULAR, fontSize: 15, lineHeight: 22, color: COLORS.SURFACE },
  userMeta: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 18,
  },
  userTime: { fontFamily: FONTS.REGULAR, fontSize: 11, color: '#6B7A8C' },


  botRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
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
  bubbleLink: { fontFamily: FONTS.SEMI_BOLD, color: COLORS.PRIMARY },


  currentCard: {
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: COLORS.SURFACE,
    overflow: 'hidden',
  },
  currentCardTopLine: { height: 4 },
  currentCardBody: { padding: 14, gap: 12 },
  currentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, letterSpacing: 0.4, color: '#4A5563' },
  currentCode: { fontFamily: FONTS.BOLD, color: '#164E78' },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BDE8D5',
    backgroundColor: SUCCESS_BG,
  },
  confirmedText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: ONLINE_GREEN },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1, gap: 2 },
  doctorName: { fontFamily: FONTS.BOLD, fontSize: 16, lineHeight: 22, color: '#0F2236' },
  specialtyText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.PRIMARY },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EDF5FC',
    borderWidth: 1,
    borderColor: '#DCEAF7',
  },
  detailCol: { flex: 1, gap: 4 },
  detailDivider: { width: 1, marginHorizontal: 12, backgroundColor: '#D3E1F3' },
  detailLabel: { fontFamily: FONTS.REGULAR, fontSize: 12, color: '#5E6F82' },
  detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailValue: { fontFamily: FONTS.BOLD, fontSize: 13, color: '#17202C' },
  detailMoney: { fontFamily: FONTS.BOLD, fontSize: 16, color: '#164E78' },
  dangerOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DANGER_BORDER,
    backgroundColor: DANGER_SOFT,
  },
  dangerOutlineText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 15, color: DANGER },


  processCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: COLORS.SURFACE,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 15, color: '#164E78' },
  stepper: { marginTop: 14 },
  stepLine: {
    position: 'absolute',
    left: 11,
    top: 14,
    bottom: 24,
    width: 2,
    backgroundColor: '#C3DDF5',
  },
  stepRow: { flexDirection: 'row', gap: 12, paddingBottom: 16 },
  stepRowLast: { paddingBottom: 0 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#C9E2F8' },
  stepDotText: { fontFamily: FONTS.BOLD, fontSize: 12, color: NAVY },
  stepContent: { flex: 1 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  stepTitle: { fontFamily: FONTS.BOLD, fontSize: 14, lineHeight: 22, color: '#17202C' },
  stepTag: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BDE8D5',
    backgroundColor: SUCCESS_BG,
  },
  stepTagText: { fontFamily: FONTS.BOLD, fontSize: 11, color: ONLINE_GREEN },
  stepDesc: { fontFamily: FONTS.REGULAR, fontSize: 13, lineHeight: 19, color: '#4A5563' },
  stepDescStrong: { fontFamily: FONTS.BOLD, color: '#0E7A55' },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#D3E1F3',
    backgroundColor: '#F3F7FC',
  },
  reasonChipActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY_TINT },
  reasonText: { fontFamily: FONTS.REGULAR, fontSize: 12.5, color: '#3F4B5B' },
  reasonTextActive: { fontFamily: FONTS.SEMI_BOLD, color: COLORS.PRIMARY },


  warnBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F6D9A0',
    backgroundColor: '#FFF6E5',
  },
  warnText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 13, lineHeight: 20, color: '#6B4A12' },
  warnStrong: { fontFamily: FONTS.BOLD, color: '#7A4B00' },


  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    backgroundColor: DANGER,
  },
  dangerButtonText: {
    fontFamily: FONTS.BOLD,
    fontSize: 14,
    letterSpacing: 0.4,
    color: COLORS.SURFACE,
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C5E1FA',
    backgroundColor: '#F1F8FE',
  },
  rescheduleButtonText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: NAVY },
  footnote: {
    marginTop: 12,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    color: '#6B7A8C',
  },


  bottomArea: {
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F8',
  },
  chipRow: { gap: 10, paddingHorizontal: 20, paddingBottom: 12 },
  chip: {
    justifyContent: 'center',
    height: 32,
    paddingHorizontal: 14,
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

