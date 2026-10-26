import { useState } from 'react';
import {
  Image,
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import { ArrowLeftIcon, HelpCircleIcon, StethoscopeIcon } from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';


function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}


const NAVY = '#025C8E';
const STAR_ON = '#F59E0B';
const STAR_OFF = '#DDE5EE';
const SUCCESS = '#19B87A';
const SUCCESS_BG = '#E3F6EE';
const BUTTON_GRADIENT = ['#2B72A6', '#025C8E'] as const;
const MAX_COMMENT = 500;
const MAX_PHOTOS = 3;


export type RatingSubmitPayload = {
  appointmentId: string;
  rating: number;
  criteria: Record<string, number>;
  tags: string[];
  comment: string;
  photos: string[];
  anonymous: boolean;
};


const VISIT = {
  id: 'apt-001',
  code: 'MC-8896-HUY',
  date: '21/10/2025',
  doctorName: 'TS.BS Lê Quang Huy',
  doctorTitle: 'Chuyên gia Nội Tim Mạch & Can thiệp',
  time: '08:30 - Thứ Ba, 21/10/2025',
  room: 'Phòng 302, Tòa A',
  avatarUri: undefined as string | undefined,
};


const RATING_LABELS: Record<number, string> = {
  1: '1 sao - Rất không hài lòng',
  2: '2 sao - Chưa hài lòng',
  3: '3 sao - Bình thường',
  4: '4 sao - Hài lòng',
  5: '5 sao - Rất hài lòng & An tâm',
};


const CRITERIA = [
  { id: 'doctor', title: 'Tận tâm & chuyên môn Bác sĩ', desc: 'Thái độ lắng nghe, giải thích bệnh án' },
  { id: 'wait', title: 'Thời gian chờ & tiếp đón', desc: 'Đúng hẹn, điều phối luồng khám nhanh' },
  { id: 'facility', title: 'Cơ sở vật chất & vệ sinh', desc: 'Không gian vô trùng, máy móc thiết bị' },
  { id: 'guide', title: 'Hướng dẫn đơn thuốc & dặn dò', desc: 'Giải thích liều dùng và chế độ dinh dưỡng' },
];


const TAGS = [
  { id: 'kind', label: 'Bác sĩ tận tình', thumb: true },
  { id: 'explain', label: 'Giải thích kỹ lưỡng' },
  { id: 'nowait', label: 'Không phải chờ lâu' },
  { id: 'clean', label: 'Phòng khám sạch đẹp' },
  { id: 'staff', label: 'Nhân viên nhẹ nhàng' },
  { id: 'fast', label: 'Thủ tục nhanh gọn' },
];


function StarIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.2 6.1 20.3l1.2-6.5L2.5 9.2l6.6-.9L12 2.3z"
        fill={active ? STAR_ON : STAR_OFF}
        stroke={active ? STAR_ON : STAR_OFF}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}


function StarRow({
  value,
  size,
  gap,
  onChange,
}: {
  value: number;
  size: number;
  gap: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} activeOpacity={0.7} hitSlop={4} onPress={() => onChange(n)}>
          <StarIcon size={size} active={n <= value} />
        </TouchableOpacity>
      ))}
    </View>
  );
}


function CheckSmallIcon({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m5 12.5 4.5 4.5L19 7.5" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function ThumbIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 10v11M7 10l4-7a2.5 2.5 0 0 1 2.5 2.5V9h5.4a2 2 0 0 1 2 2.3l-1.2 7.5a2 2 0 0 1-2 1.7H7"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={2.5} y={10} width={4.5} height={11} rx={1} stroke="#FFFFFF" strokeWidth={2} />
    </Svg>
  );
}


function SmileIcon({ size = 16, color = NAVY }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={2} />
      <Path d="M8 14c1 1.5 2.3 2.2 4 2.2s3-.7 4-2.2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={9} cy={9.8} r={1.1} fill={color} />
      <Circle cx={15} cy={9.8} r={1.1} fill={color} />
    </Svg>
  );
}


function ClockSmallIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={NAVY} strokeWidth={2} />
      <Path d="M12 7v5l3 2" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function BuildingIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={3} width={16} height={18} rx={2} stroke={NAVY} strokeWidth={2} />
      <Path d="M8.5 8h2M13.5 8h2M8.5 12h2M13.5 12h2M10 21v-4h4v4" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
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


function CheckCircleFilled() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={SUCCESS} />
      <Path d="m8 12.2 2.8 2.8L16 9.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function ImagePlusIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 5h6M19 2v6M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={9} r={2} stroke={NAVY} strokeWidth={2} />
    </Svg>
  );
}


function CloseSmallIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="m6 6 12 12M18 6 6 18" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}


function SendPlaneIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11.5 21 3l-8.5 18-2.2-7.3L3 11.5Z"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}


type RatingScreenProps = {
  onPressBack?: () => void;
  onPressHelp?: () => void;
  onPressAddPhoto?: () => Promise<string | null | undefined> | string | null | undefined;
  onSubmit?: (payload: RatingSubmitPayload) => void;
};


export default function RatingScreen({
  onPressBack,
  onPressHelp,
  onPressAddPhoto,
  onSubmit,
}: RatingScreenProps) {
  const [rating, setRating] = useState(5);
  const [criteria, setCriteria] = useState<Record<string, number>>(
    () => Object.fromEntries(CRITERIA.map((item) => [item.id, 5])),
  );
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(true);


  const toggleTag = (id: string) =>
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));


  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const uri = await onPressAddPhoto?.();
    if (uri) setPhotos((prev) => [...prev, uri].slice(0, MAX_PHOTOS));
  };


  const handleSubmit = () => {
    onSubmit?.({
      appointmentId: VISIT.id,
      rating,
      criteria,
      tags,
      comment: comment.trim(),
      photos,
      anonymous,
    });
  };


  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack} hitSlop={10} style={styles.headerSide}>
          <ArrowLeftIcon size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đánh giá dịch vụ</Text>
          <Text style={styles.headerSub}>Lượt khám ngày {VISIT.date}</Text>
        </View>
        <TouchableOpacity
          onPress={onPressHelp}
          hitSlop={10}
          style={[styles.headerSide, styles.headerSideRight]}
        >
          <HelpCircleIcon size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>


      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <LinearGradient
              colors={['#7CC4F5', '#025C8E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardTopLine}
            />
            <View style={styles.visitBody}>
              <View style={styles.visitHeaderRow}>
                <View style={styles.doneBadge}>
                  <CheckCircleFilled />
                  <Text style={styles.doneText}>Đã hoàn thành khám</Text>
                </View>
                <Text style={styles.visitCode}>#{VISIT.code}</Text>
              </View>
              <View style={styles.divider} />


              <View style={styles.doctorRow}>
                <View style={styles.doctorAvatar}>
                  {VISIT.avatarUri ? (
                    <Image source={{ uri: VISIT.avatarUri }} style={styles.doctorAvatarImg} />
                  ) : (
                    <StethoscopeIcon size={30} color={COLORS.PRIMARY} />
                  )}
                </View>
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>{VISIT.doctorName}</Text>
                    <VerifiedBadge />
                  </View>
                  <Text style={styles.doctorTitle}>{VISIT.doctorTitle}</Text>
                  <View style={styles.metaRow}>
                    <ClockSmallIcon />
                    <Text style={styles.metaText}>{VISIT.time}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <BuildingIcon />
                    <Text style={styles.metaText}>{VISIT.room}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>


          <View style={[styles.card, styles.overallCard]}>
            <View style={styles.overallPill}>
              <Text style={styles.overallPillText}>Trải nghiệm chung</Text>
            </View>
            <Text style={styles.overallTitle}>Bạn cảm thấy trải nghiệm khám bệnh hôm nay thế nào?</Text>
            <Text style={styles.overallHint}>Chạm vào số sao để xếp hạng mức độ hài lòng</Text>
            <View style={styles.bigStars}>
              <StarRow value={rating} size={40} gap={14} onChange={setRating} />
            </View>
            <View style={styles.ratingLabel}>
              <SmileIcon />
              <Text style={styles.ratingLabelText}>{RATING_LABELS[rating]}</Text>
            </View>
          </View>


          <View style={[styles.card, styles.sectionCard]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đánh giá theo tiêu chí</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>Chi tiết {CRITERIA.length} mục</Text>
              </View>
            </View>
            <View style={styles.divider} />
            {CRITERIA.map((item, index) => (
              <View
                key={item.id}
                style={[styles.criteriaRow, index < CRITERIA.length - 1 && styles.criteriaRowBorder]}
              >
                <View style={styles.criteriaText}>
                  <Text style={styles.criteriaTitle}>{item.title}</Text>
                  <Text style={styles.criteriaDesc}>{item.desc}</Text>
                </View>
                <StarRow
                  value={criteria[item.id]}
                  size={22}
                  gap={3}
                  onChange={(value) => setCriteria((prev) => ({ ...prev, [item.id]: value }))}
                />
              </View>
            ))}
          </View>


          <View style={[styles.card, styles.sectionCard]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Điểm bạn ấn tượng nhất</Text>
              <Text style={styles.sectionHint}>Chọn nhiều tag</Text>
            </View>
            <View style={styles.tagWrap}>
              {TAGS.map((tag) => {
                const active = tags.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    activeOpacity={0.8}
                    style={[styles.tag, active && styles.tagActive]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    {active ? tag.thumb ? <ThumbIcon /> : <CheckSmallIcon /> : null}
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>


          <View style={[styles.card, styles.sectionCard]}>
            <Text style={styles.sectionTitle}>Nhận xét chi tiết</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              textAlignVertical="top"
              maxLength={MAX_COMMENT}
              placeholder="Chia sẻ trải nghiệm của bạn về buổi khám..."
              placeholderTextColor="#A9B8C8"
              value={comment}
              onChangeText={setComment}
              allowFontScaling={false}
            />
            <Text style={styles.counter}>
              {comment.length}/{MAX_COMMENT} ký tự
            </Text>


            <Text style={styles.photoLabel}>Hình ảnh đính kèm (nếu có)</Text>
            <View style={styles.photoRow}>
              {photos.length < MAX_PHOTOS ? (
                <TouchableOpacity style={styles.addPhoto} activeOpacity={0.8} onPress={handleAddPhoto}>
                  <ImagePlusIcon />
                  <Text style={styles.addPhotoText}>Thêm ảnh</Text>
                </TouchableOpacity>
              ) : null}
              {photos.map((uri) => (
                <View key={uri} style={styles.photoBox}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    hitSlop={6}
                    onPress={() => setPhotos((prev) => prev.filter((p) => p !== uri))}
                  >
                    <CloseSmallIcon />
                  </TouchableOpacity>
                </View>
              ))}
            </View>


            <TouchableOpacity
              style={styles.anonymousRow}
              activeOpacity={0.8}
              onPress={() => setAnonymous((prev) => !prev)}
            >
              <View style={[styles.checkbox, anonymous && styles.checkboxActive]}>
                {anonymous ? <CheckSmallIcon size={14} /> : null}
              </View>
              <Text style={styles.anonymousText}>
                Đánh giá ẩn danh (giấu thông tin cá nhân trên bảng tin bệnh viện)
              </Text>
            </TouchableOpacity>
          </View>


          <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit}>
            <LinearGradient
              colors={BUTTON_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.4 }}
              style={styles.submitButton}
            >
              <Text style={styles.submitText}>GỬI ĐÁNH GIÁ</Text>
              <SendPlaneIcon />
            </LinearGradient>
          </TouchableOpacity>


          <Text style={styles.privacy}>
            MediConnect cam kết bảo mật thông tin y khoa & quyền riêng tư bệnh nhân
          </Text>
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F8',
  },
  headerSide: { width: 32 },
  headerSideRight: { alignItems: 'flex-end' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: FONTS.BOLD, fontSize: 18, lineHeight: 24, color: '#164E78' },
  headerSub: { fontFamily: FONTS.REGULAR, fontSize: 12, lineHeight: 16, color: '#4A5563' },


  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E6F4',
    backgroundColor: COLORS.SURFACE,
    overflow: 'hidden',
  },
  cardTopLine: { height: 4 },
  divider: { height: 1, backgroundColor: '#E6EEF8' },


  visitBody: { padding: 16, gap: 12 },
  visitHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BDE8D5',
    backgroundColor: SUCCESS_BG,
  },
  doneText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: '#0E7A55' },
  visitCode: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: '#6B7A8C' },
  doctorRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  doctorAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#C9E0F5',
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  doctorAvatarImg: { width: '100%', height: '100%' },
  doctorInfo: { flex: 1, gap: 4 },
  doctorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doctorName: { fontFamily: FONTS.BOLD, fontSize: 17, lineHeight: 24, color: '#0F2236' },
  doctorTitle: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, lineHeight: 19, color: NAVY },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontFamily: FONTS.REGULAR, fontSize: 13, color: '#3F4B5B' },


  overallCard: { padding: 16, alignItems: 'center' },
  overallPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E0EEFB',
  },
  overallPillText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12.5, color: '#1B5E94' },
  overallTitle: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
    fontSize: 19,
    lineHeight: 27,
    color: '#164E78',
  },
  overallHint: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 12.5,
    color: '#5E6F82',
  },
  bigStars: { marginTop: 18, marginBottom: 18 },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E0EEFB',
    borderWidth: 1,
    borderColor: '#C5E1FA',
  },
  ratingLabelText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: NAVY },


  sectionCard: { padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 18, color: '#164E78' },
  sectionHint: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12.5, color: '#6B7A8C' },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#E0EEFB',
  },
  countPillText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: '#1B5E94' },


  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  criteriaRowBorder: { borderBottomWidth: 1, borderBottomColor: '#EDF2F8' },
  criteriaText: { flex: 1, gap: 2 },
  criteriaTitle: { fontFamily: FONTS.SEMI_BOLD, fontSize: 15, lineHeight: 22, color: '#17202C' },
  criteriaDesc: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, lineHeight: 17, color: '#7A8696' },


  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#E6F0FA',
  },
  tagActive: { backgroundColor: NAVY },
  tagText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: NAVY },
  tagTextActive: { color: '#FFFFFF' },


  commentInput: {
    minHeight: 110,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3E1F3',
    backgroundColor: '#F8FBFE',
    fontFamily: FONTS.REGULAR,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.TEXT,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    color: '#6B7A8C',
  },
  photoLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: '#3F4B5B' },
  photoRow: { flexDirection: 'row', gap: 12 },
  addPhoto: {
    width: 76,
    height: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#7CB6E3',
    backgroundColor: '#EDF5FC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11.5, color: NAVY },
  photoBox: { width: 76, height: 76, borderRadius: 14, overflow: 'visible' },
  photoImg: { width: '100%', height: '100%', borderRadius: 14, backgroundColor: '#E6F0FA' },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3A4654',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#B8C7D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { borderColor: NAVY, backgroundColor: NAVY },
  anonymousText: {
    flex: 1,
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    lineHeight: 19,
    color: '#3F4B5B',
  },


  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  submitText: { fontFamily: FONTS.BOLD, fontSize: 16, letterSpacing: 0.6, color: '#FFFFFF' },
  privacy: {
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7A8C',
    paddingHorizontal: 12,
  },
});

