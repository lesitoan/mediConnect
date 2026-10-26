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
const BUTTON_GRADIENT = ['#025C8E', '#2B72A6'] as const;


type SuggestedSlot = {
  id: string;
  dayLabel: string;
  timeRange: string;
  buttonLabel: string;
};


const CURRENT_APPOINTMENT = {
  id: 'apt-001',
  doctorName: 'TS.BS Lê Quang Huy',
  specialty: 'Nội Tim Mạch',
  time: '08:30 - Thứ Ba, 21/10/2025',
  room: 'Phòng 302, Tòa A',
};


const SUGGESTED_SLOTS: SuggestedSlot[] = [
  {
    id: 'thu-5',
    dayLabel: 'Chiều Thứ Năm (23/10)',
    timeRange: '14:30 - 15:00',
    buttonLabel: 'ĐỔI SANG 14:30 THỨ NĂM',
  },
  {
    id: 'thu-6',
    dayLabel: 'Sáng Thứ Sáu (24/10)',
    timeRange: '09:00 - 09:30',
    buttonLabel: 'ĐỔI SANG 09:00 THỨ SÁU',
  },
];


const STEPS = [
  {
    title: 'Chọn ngày & khung giờ mới',
    desc: 'Hệ thống tự động hiển thị ca trống phù hợp của bác sĩ.',
  },
  {
    title: 'Kiểm tra chênh lệch chi phí',
    desc: 'Đổi trước 02 giờ hoàn toàn miễn phí 100%.',
    tag: '0đ',
  },
  {
    title: 'Xác nhận & Nhận mã hẹn mới',
    desc: 'Tự động cập nhật vào ứng dụng và gửi tin nhắn SMS xác thực.',
  },
];


const QUICK_CHIPS = [
  { id: 'policy', label: 'Quy định hủy/đổi lịch', icon: 'shield' as const },
  { id: 'fee', label: 'Phí đổi hẹn', icon: 'wallet' as const },
  { id: 'history', label: 'Xem lại lịch sử', icon: 'history' as const },
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
          <SvgGradient id="rescheduleAvatarRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D6E8F9" />
            <Stop offset="1" stopColor="#2F86D6" />
          </SvgGradient>
        </Defs>
        <Circle cx={24} cy={24} r={22} fill="#FFFFFF" stroke="url(#rescheduleAvatarRing)" strokeWidth={3} />
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


function CalendarCheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15.5} rx={3} stroke={NAVY} strokeWidth={2} />
      <Path d="M3.5 10H20.5M8 3V7M16 3V7" stroke={NAVY} strokeWidth={2} strokeLinecap="round" />
      <Path d="m9 15 2 2 4-4" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function PinIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={9.5} r={2.5} stroke={NAVY} strokeWidth={2} />
    </Svg>
  );
}


function SwapIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


function ClockIcon({ color = NAVY }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.2} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function BranchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3v6a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v4M6 3 3.5 6M6 3l2.5 3M18 21l-2.5-3M18 21l2.5-3"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


function BoltIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}


function UsersIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={8} r={3.2} stroke={NAVY} strokeWidth={2} />
      <Path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" stroke={NAVY} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.6 3 2.2 3 4.2" stroke={NAVY} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}


function InfoIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={NAVY} strokeWidth={2} />
      <Path d="M12 11v6" stroke={NAVY} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={12} cy={7.6} r={1.2} fill={NAVY} />
    </Svg>
  );
}


function ChipIcon({ type }: { type: 'shield' | 'wallet' | 'history' }) {
  if (type === 'shield') {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3 4.5 6v5.5c0 4.5 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5 7.5-9.5V6L12 3Z"
          stroke={COLORS.PRIMARY}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path d="m9 12 2.2 2.2L15.5 10" stroke={COLORS.PRIMARY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (type === 'wallet') {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x={2.5} y={6} width={19} height={13} rx={3} stroke={COLORS.PRIMARY} strokeWidth={2} />
        <Path d="M2.5 10h19" stroke={COLORS.PRIMARY} strokeWidth={2} />
        <Circle cx={16.5} cy={14.5} r={1.2} fill={COLORS.PRIMARY} />
      </Svg>
    );
  }
  return <HistoryIcon size={16} color={COLORS.PRIMARY} strokeWidth={2} />;
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
      <Path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


const getTimeLabel = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  return `Hôm nay, ${day} Tháng ${month} • Hỗ trợ xếp lịch khám`;
};


const getSentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `hours:{minutes}`;
};


type AIRescheduleScreenProps = {
  onPressBack?: () => void;
  onPressSelectReschedule?: (appointmentId: string) => void;
  onPressConfirmSlot?: (appointmentId: string, slot: SuggestedSlot) => void;
  onPressOtherDoctors?: () => void;
  onPressChip?: (id: string) => void;
};


export default function AIRescheduleScreen({
  onPressBack,
  onPressSelectReschedule,
  onPressConfirmSlot,
  onPressOtherDoctors,
  onPressChip,
}: AIRescheduleScreenProps) {
  const [inputText, setInputText] = useState('');
  const [timeLabel] = useState(getTimeLabel);
  const [sentTime] = useState(getSentTime);
  const [selectedSlotId, setSelectedSlotId] = useState(SUGGESTED_SLOTS[0].id);


  const selectedSlot =
    SUGGESTED_SLOTS.find((slot) => slot.id === selectedSlotId) ?? SUGGESTED_SLOTS[0];


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
              Tôi muốn đổi lịch khám của TS.BS Lê Quang Huy từ sáng mai sang ngày khác, hướng dẫn
              tôi các bước đổi lịch với.
            </Text>
            <Text style={styles.userTime}>{sentTime}</Text>
          </View>


          <View style={styles.botRow}>
            <BotAvatar />
            <View style={styles.botColumn}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>
                  Dạ MediCare AI sẵn sàng hỗ trợ! Lịch khám hiện tại của bạn tại{' '}
                  <Text style={styles.bubbleLink}>Khoa Nội Tim mạch</Text> có thể đổi dễ dàng theo
                  3 bước đơn giản dưới đây:
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
                <Text style={styles.currentLabel}>LỊCH KHÁM HIỆN TẠI</Text>
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
                  <View style={styles.specialtyRow}>
                    <StethoscopeIcon size={14} color={COLORS.PRIMARY} />
                    <Text style={styles.specialtyText}>{CURRENT_APPOINTMENT.specialty}</Text>
                  </View>
                </View>
              </View>


              <View style={styles.detailBox}>
                <View style={styles.detailRow}>
                  <CalendarCheckIcon />
                  <Text style={styles.detailText}>{CURRENT_APPOINTMENT.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <PinIcon />
                  <Text style={styles.detailText}>{CURRENT_APPOINTMENT.room}</Text>
                </View>
              </View>


              <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.8}
                onPress={() => onPressSelectReschedule?.(CURRENT_APPOINTMENT.id)}
              >
                <SwapIcon />
                <Text style={styles.outlineButtonText}>Chọn đổi lịch này</Text>
              </TouchableOpacity>
            </View>
          </View>


          <View style={styles.processCard}>
            <View style={styles.sectionTitleRow}>
              <BranchIcon />
              <Text style={styles.sectionTitle}>Quy trình đổi lịch 3 bước</Text>
            </View>


            <View style={styles.stepper}>
              <View style={styles.stepLine} />
              {STEPS.map((step, index) => (
                <View key={step.title} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepTitleRow}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      {step.tag ? (
                        <View style={styles.stepTag}>
                          <Text style={styles.stepTagText}>{step.tag}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>


          <View style={styles.suggestCard}>
            <View style={styles.sectionTitleRow}>
              <BoltIcon />
              <Text style={styles.suggestTitle}>Gợi ý ca trống của BS. Huy</Text>
              <TouchableOpacity hitSlop={8} onPress={onPressOtherDoctors}>
                <Text style={styles.suggestLink}>Khoa Tim Mạch</Text>
              </TouchableOpacity>
            </View>


            <View style={styles.slotList}>
              {SUGGESTED_SLOTS.map((slot) => {
                const active = slot.id === selectedSlotId;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    activeOpacity={0.85}
                    style={[styles.slotCard, active && styles.slotCardActive]}
                    onPress={() => setSelectedSlotId(slot.id)}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.slotTextBox}>
                      <Text style={styles.slotDay}>{slot.dayLabel}</Text>
                      <View style={styles.slotTimeRow}>
                        <ClockIcon />
                        <Text style={styles.slotTime}>{slot.timeRange}</Text>
                      </View>
                    </View>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableText}>Còn trống</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>


            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onPressConfirmSlot?.(CURRENT_APPOINTMENT.id, selectedSlot)}
            >
              <LinearGradient
                colors={BUTTON_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.4 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>{selectedSlot.buttonLabel}</Text>
                <ArrowRightIcon />
              </LinearGradient>
            </TouchableOpacity>


            <TouchableOpacity style={styles.otherDoctorRow} hitSlop={8} onPress={onPressOtherDoctors}>
              <UsersIcon />
              <Text style={styles.otherDoctorText}>Xem lịch trống của bác sĩ khác cùng khoa</Text>
            </TouchableOpacity>
          </View>


          <View style={styles.noteBox}>
            <InfoIcon />
            <Text style={styles.noteText}>
              <Text style={styles.noteStrong}>Lưu ý: </Text>
              Đổi lịch miễn phí nếu thực hiện trước giờ khám ít nhất 02 tiếng. Hồ sơ kết quả xét
              nghiệm trước đó sẽ được tự động đồng bộ sang lịch hẹn mới.
            </Text>
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
                <ChipIcon type={chip.icon} />
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
    borderWidth: 1,
    borderColor: '#D3E1F3',
  },
  dateChipText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: '#3F4B5B' },


  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: '#0B4F7E',
  },
  userText: { fontFamily: FONTS.REGULAR, fontSize: 15, lineHeight: 22, color: COLORS.SURFACE },
  userTime: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
    fontSize: 11,
    color: '#A9CBE6',
  },


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
  currentLabel: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#4A5563',
  },
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
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1, gap: 2 },
  doctorName: { fontFamily: FONTS.BOLD, fontSize: 16, lineHeight: 22, color: '#0F2236' },
  specialtyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specialtyText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: COLORS.PRIMARY },
  detailBox: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EDF5FC',
    borderWidth: 1,
    borderColor: '#DCEAF7',
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontFamily: FONTS.REGULAR, fontSize: 14, lineHeight: 20, color: COLORS.TEXT },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#9CCBF0',
    backgroundColor: '#EAF4FD',
  },
  outlineButtonText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 15, color: NAVY },


  processCard: {
    marginBottom: 16,
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
    bottom: 26,
    width: 2,
    backgroundColor: '#C3DDF5',
  },
  stepRow: { flexDirection: 'row', gap: 12, paddingBottom: 14 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontFamily: FONTS.BOLD, fontSize: 12, color: NAVY },
  stepContent: { flex: 1 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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


  suggestCard: {
    marginBottom: 16,
    padding: 14,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDDF5',
    backgroundColor: '#F1F8FE',
  },
  suggestTitle: { flex: 1, fontFamily: FONTS.BOLD, fontSize: 14, color: '#164E78' },
  suggestLink: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: NAVY },
  slotList: { gap: 10 },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E6EEF8',
    backgroundColor: COLORS.SURFACE,
  },
  slotCardActive: { borderColor: COLORS.PRIMARY, backgroundColor: '#F6FBFF' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B8C7D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  slotTextBox: { flex: 1, gap: 2 },
  slotDay: { fontFamily: FONTS.BOLD, fontSize: 14, color: '#0F2236' },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  slotTime: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: NAVY },
  availableBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BDE8D5',
    backgroundColor: SUCCESS_BG,
  },
  availableText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: ONLINE_GREEN },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontFamily: FONTS.BOLD,
    fontSize: 14,
    letterSpacing: 0.4,
    color: COLORS.SURFACE,
  },
  otherDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  otherDoctorText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: NAVY },


  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3E6F8',
    backgroundColor: '#EDF5FC',
  },
  noteText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 13, lineHeight: 20, color: '#3F4B5B' },
  noteStrong: { fontFamily: FONTS.BOLD, color: '#164E78' },


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

