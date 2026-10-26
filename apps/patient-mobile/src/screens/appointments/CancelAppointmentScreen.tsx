import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  UserIcon,
  XCircleIcon,
} from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';
// Import service để load Mock Data
import {
  getAppointmentById,
  formatFee,
  type Appointment,
} from '../../services/appointmentService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const REASONS = [
  'Tình trạng sức khỏe đã ổn định / Đã khỏi bệnh',
  'Bận việc cá nhân / Công tác đột xuất',
  'Muốn đổi sang bác sĩ hoặc bệnh viện khác',
  'Thời gian không còn phù hợp',
  'Lý do khác (Vui lòng ghi rõ)',
];

type CancelAppointmentScreenProps = {
  appointmentId: string;
  appointmentCode: string; 
  onPressBack?: () => void;
  onPressReschedule?: () => void;
  onConfirmCancel?: () => void;
};

export default function CancelAppointmentScreen({
  appointmentId,
  appointmentCode,
  onPressBack,
  onPressReschedule,
  onConfirmCancel,
}: CancelAppointmentScreenProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState<string>('Bận việc cá nhân / Công tác đột xuất');
  const [otherReason, setOtherReason] = useState('');

  // Load Mock Data từ Service
  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const data = await getAppointmentById(appointmentId);
        if (isActive) setAppointment(data);
      } finally {
        if (isActive) setIsLoading(false);
      }
    })();
    return () => { isActive = false; };
  }, [appointmentId]);

  const handleConfirm = () => {
    if (selectedReason === 'Lý do khác (Vui lòng ghi rõ)' && !otherReason.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập chi tiết lý do hủy.');
      return;
    }
    
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy lịch khám này không?',
      [
        { text: 'Quay lại', style: 'cancel' },
        { 
          text: 'Đồng ý hủy', 
          style: 'destructive',
          onPress: () => {
            onConfirmCancel?.();
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={onPressBack} hitSlop={10}>
          <ArrowLeftIcon size={24} color={COLORS.PRIMARY_LIGHT} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Hủy lịch hẹn</Text>
          <Text style={styles.headerSub}>Phiếu khám #{appointmentCode}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PATIENT CARD */}
        <View style={styles.patientCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>TQ</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>TRẦN THỊ QUỲNH</Text>
            <Text style={styles.patientCode}>Mã BN: MC-0502537</Text>
          </View>
        </View>

        {/* APPOINTMENT SUMMARY CARD */}
        <View style={styles.appointmentCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ĐÃ XÁC NHẬN • SẮP DIỄN RA</Text>
            </View>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>#{appointmentCode}</Text>
            </View>
          </View>

          <View style={styles.doctorRow}>
            <View style={styles.doctorAvatar}>
              <UserIcon size={24} color={COLORS.PRIMARY_LIGHT} />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{appointment?.doctorName ?? 'Đang tải...'}</Text>
              <Text style={styles.doctorSpecialty}>
                {appointment?.specialty} • {appointment?.expertise}
              </Text>
            </View>
            {appointment?.rating !== undefined && (
              <View style={styles.rating}>
                <StarIcon size={14} color="#F5A524" fill="#F5A524" />
                <Text style={styles.ratingText}>{appointment.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <View style={styles.infoHead}>
                <ClockIcon size={16} color={COLORS.PRIMARY_LIGHT} />
                <Text style={styles.infoLabel}>Thời gian hẹn</Text>
              </View>
              <Text style={styles.infoValue}>
                {appointment?.time} • {appointment?.weekday}
              </Text>
              <Text style={styles.infoSub}>{appointment?.date}</Text>
            </View>
            
            <View style={styles.infoBox}>
              <View style={styles.infoHead}>
                <MapPinIcon size={16} color={COLORS.PRIMARY_LIGHT} />
                <Text style={styles.infoLabel}>Phòng khám</Text>
              </View>
              <Text style={styles.infoValue}>{appointment?.room}</Text>
              <Text style={styles.infoSub}>{appointment?.building}</Text>
            </View>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Phí khám thanh toán:</Text>
            <Text style={styles.feeValue}>
              {appointment?.advanceFee ? formatFee(appointment.advanceFee) : '0 đ'}
            </Text>
          </View>
        </View>

        {/* REASON SELECTION */}
        <View style={styles.reasonSection}>
          <View style={styles.reasonHeader}>
            <Text style={styles.reasonTitle}>Vui lòng cho biết lý do hủy lịch <Text style={{ color: COLORS.DANGER }}>*</Text></Text>
          </View>
          <Text style={styles.reasonSubtitle}>
            Ý kiến của quý khách giúp MediConnect nâng cao chất lượng dịch vụ.
          </Text>

          <View style={styles.optionsList}>
            {REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <View key={reason}>
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionItemActive]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                      {reason}
                    </Text>
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>

                  {/* Input for "Lý do khác" */}
                  {isSelected && reason === 'Lý do khác (Vui lòng ghi rõ)' && (
                    <TextInput
                      style={styles.otherInput}
                      placeholder="Nhập chi tiết lý do (không bắt buộc)..."
                      placeholderTextColor={COLORS.PLACEHOLDER}
                      value={otherReason}
                      onChangeText={setOtherReason}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* WARNING BOX */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Lưu ý y tế quan trọng:</Text>
            <Text style={styles.warningText}>
              Sau khi hủy, khung giờ khám này sẽ được mở lại cho bệnh nhân khác trên hệ thống. 
              Nếu có nhu cầu tiếp tục theo dõi tình trạng, quý khách vui lòng chọn "Đổi ngày khám" hoặc đặt lượt khám mới.
            </Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.confirmCancelBtn} activeOpacity={0.85} onPress={handleConfirm}>
            <XCircleIcon size={18} color={COLORS.SURFACE} />
            <Text style={styles.confirmCancelText}>XÁC NHẬN HỦY LỊCH HẸN</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.keepBtn} activeOpacity={0.85} onPress={onPressBack}>
              <Text style={styles.keepBtnText}>Giữ lại lịch khám</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rescheduleBtn} activeOpacity={0.85} onPress={onPressReschedule}>
              <CalendarClockIcon size={16} color={COLORS.PRIMARY_LIGHT} />
              <Text style={styles.rescheduleBtnText}>Đổi ngày khám</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.BACKGROUND },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  headerBack: { marginRight: 12 },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 18, color: COLORS.TEXT },
  headerSub: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Patient Card
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY_LIGHT,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontFamily: FONTS.BOLD, fontSize: 18, color: COLORS.PRIMARY_LIGHT },
  patientInfo: { flex: 1 },
  patientName: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT },
  patientCode: { fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 4 },

  // Appointment Card
  appointmentCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 20,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F6EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2BB673' },
  statusText: { fontFamily: FONTS.BOLD, fontSize: 10, color: '#1E8E4E' },
  codeBadge: { backgroundColor: '#F4F7FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  codeText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: COLORS.TEXT_MUTED },
  
  doctorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontFamily: FONTS.BOLD, fontSize: 16, color: COLORS.PRIMARY_LIGHT },
  doctorSpecialty: { fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },

  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoBox: {
    flex: 1,
    backgroundColor: '#F8FAFD',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoLabel: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED },
  infoValue: { fontFamily: FONTS.BOLD, fontSize: 13, color: COLORS.TEXT },
  infoSub: { fontFamily: FONTS.REGULAR, fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 2 },
  
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 12,
  },
  feeLabel: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED },
  feeValue: { fontFamily: FONTS.BOLD, fontSize: 16, color: COLORS.PRIMARY_LIGHT },

  // Reason Section
  reasonSection: { marginBottom: 20 },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reasonTitle: { fontFamily: FONTS.BOLD, fontSize: 15, color: COLORS.TEXT },
  reasonSubtitle: { fontFamily: FONTS.REGULAR, fontSize: 13, color: COLORS.TEXT_MUTED, marginBottom: 12 },
  optionsList: { gap: 10 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  optionItemActive: { borderColor: COLORS.PRIMARY_LIGHT, backgroundColor: '#F0F7FF' },
  optionText: { flex: 1, fontFamily: FONTS.REGULAR, fontSize: 14, color: COLORS.TEXT, paddingRight: 10 },
  optionTextActive: { fontFamily: FONTS.SEMI_BOLD, color: COLORS.PRIMARY_LIGHT },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.ICON_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.PRIMARY_LIGHT },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.PRIMARY_LIGHT },
  otherInput: {
    marginTop: 8,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: FONTS.REGULAR,
    fontSize: 14,
    color: COLORS.TEXT,
    backgroundColor: COLORS.SURFACE,
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  warningIcon: { fontSize: 16 },
  warningContent: { flex: 1 },
  warningTitle: { fontFamily: FONTS.BOLD, fontSize: 13, color: '#B7791F', marginBottom: 4 },
  warningText: { fontFamily: FONTS.REGULAR, fontSize: 12, color: '#92400E', lineHeight: 18 },

  // Actions
  actionSection: { gap: 12 },
  confirmCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  confirmCancelText: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.SURFACE },
  secondaryActions: { flexDirection: 'row', gap: 12 },
  keepBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepBtnText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: COLORS.TEXT },
  rescheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_TINT,
    borderWidth: 1,
    borderColor: '#CFE2F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rescheduleBtnText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: COLORS.PRIMARY_LIGHT },
});