import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import ScreenHeader from '../../components/ScreenHeader';
import {
  ChevronRightIcon,
  IdCardIcon,
  LayoutGridIcon,
  PhoneIcon,
  PlusCircleIcon,
  UserIcon,
  UserPlusIcon,
} from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';
import { getProfiles, type Profile } from '../../services/profileService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const BUTTON_GRADIENT = ['#3A80B2', '#005B8D'] as const;

const maskPhone = (phone: string) =>
  phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : phone;

const getShortName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1].toUpperCase();
};

type BookingProfileScreenProps = {
  onPressBack?: () => void;
  onPressHome?: () => void;
  onPressAddProfile?: () => void;
  onSelectProfile?: (profile: Profile) => void;
};

export default function BookingProfileScreen({
  onPressBack,
  onPressHome,
  onPressAddProfile,
  onSelectProfile,
}: BookingProfileScreenProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      getProfiles()
        .then((data) => {
          if (isActive) setProfiles(data);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.PRIMARY_LIGHT} />
        </View>
      );
    }

    if (profiles.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyAvatar}>
            <UserIcon size={48} color="#9AA6B6" strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có hồ sơ đặt khám</Text>
          <Text style={styles.emptySubtitle}>Vui lòng tạo hồ sơ mới để bắt đầu đặt khám</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.85}
            onPress={onPressAddProfile}
          >
            <LinearGradient
              colors={BUTTON_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonInner}
            >
              <PlusCircleIcon size={18} color={COLORS.SURFACE} />
              <Text style={styles.emptyButtonText}>Thêm mới hồ sơ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Chọn hồ sơ</Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={onPressAddProfile}
          >
            <LinearGradient
              colors={BUTTON_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonInner}
            >
              <UserPlusIcon size={16} color={COLORS.SURFACE} />
              <Text style={styles.addButtonText}>Thêm mới hồ sơ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRow}
          style={styles.avatarScroll}
        >
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={styles.avatarItem}
              activeOpacity={0.8}
              onPress={() => onSelectProfile?.(profile)}
            >
              <View style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  <UserIcon size={26} color={COLORS.PRIMARY_LIGHT} strokeWidth={1.8} />
                </View>
              </View>
              <Text style={styles.avatarName} numberOfLines={1}>
                {getShortName(profile.fullName)}
              </Text>
              <Text style={styles.avatarCode} numberOfLines={1}>
                {profile.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cards}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => onSelectProfile?.(profile)}
            >
              <View style={styles.cardTop}>
                <LayoutGridIcon size={16} color={COLORS.PRIMARY_LIGHT} />
                <Text style={styles.cardName} numberOfLines={1}>
                  {profile.fullName.toUpperCase()}
                </Text>
                <ChevronRightIcon size={18} color={COLORS.ICON_MUTED} />
              </View>
              <View style={styles.cardInfo}>
                <IdCardIcon size={16} color={COLORS.ICON_MUTED} />
                <Text style={styles.cardCode}>{profile.code}</Text>
                <View style={styles.cardDivider} />
                <PhoneIcon size={14} color={COLORS.ICON_MUTED} />
                <Text style={styles.cardPhone}>{maskPhone(profile.phone)}</Text>
                {profile.isSelf && (
                  <View style={styles.tag}>
                    <UserIcon size={11} color={COLORS.PRIMARY_LIGHT} />
                    <Text style={styles.tagText}>Tôi</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Đặt khám" onPressBack={onPressBack} onPressHome={onPressHome} />
      {renderBody()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.BACKGROUND },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 56,
  },
  emptyAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EAEFF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 24,
    fontFamily: FONTS.BOLD,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    color: '#8A96A8',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 40,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyButtonText: { fontFamily: FONTS.BOLD, fontSize: 14, color: COLORS.SURFACE },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: { fontFamily: FONTS.BOLD, fontSize: 18, lineHeight: 24, color: COLORS.TEXT },
  addButton: {
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addButtonText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 12, color: COLORS.SURFACE },
  avatarScroll: { marginTop: 20, flexGrow: 0 },
  avatarRow: { gap: 16, paddingRight: 16 },
  avatarItem: { width: 76, alignItems: 'center' },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_LIGHT,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: COLORS.PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarName: {
    marginTop: 6,
    fontFamily: FONTS.BOLD,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.PRIMARY_LIGHT,
  },
  avatarCode: {
    fontFamily: FONTS.REGULAR,
    fontSize: 9,
    lineHeight: 13,
    color: COLORS.ICON_MUTED,
  },
  cards: { marginTop: 20, gap: 12 },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 14,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: {
    flex: 1,
    fontFamily: FONTS.BOLD,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.PRIMARY_LIGHT,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F4F7FB',
  },
  cardCode: { fontFamily: FONTS.BOLD, fontSize: 12, color: COLORS.TEXT },
  cardDivider: { width: 1, height: 14, marginHorizontal: 4, backgroundColor: COLORS.BORDER },
  cardPhone: { fontFamily: FONTS.REGULAR, fontSize: 12, color: COLORS.TEXT_MUTED },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: COLORS.PRIMARY_TINT,
  },
  tagText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: COLORS.PRIMARY_LIGHT },
});