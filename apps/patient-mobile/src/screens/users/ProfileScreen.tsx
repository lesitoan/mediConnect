
import { useEffect, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text as RNText,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon, HeartPulseIcon, UserIcon } from '../../components/icons';
import {
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  FileCheckIcon,
  KeyIcon,
  LogOutIcon,
  ShieldCheckIcon,
  type BookingIconProps,
} from '../../components/bookingIcons';
import { COLORS, FONTS } from '../../constants/theme';
import { getProfiles, type Profile } from '../../services/profileService';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type MenuItem = {
  id: string;
  label: string;
  Icon: ComponentType<BookingIconProps>;
  onPress: () => void;
};

const SCREEN_PADDING = 16;
const NAVY = '#12395C';
const MUTED_TEXT = '#8A96A8';
const SECTION_LABEL_COLOR = '#6B8CAE';
const ICON_BOX_BACKGROUND = '#E1EEFB';
const HEADER_GRADIENT = ['#5BA3D9', '#2B6CA3'] as const;
const VERIFIED_GREEN = '#2EAD6B';
const LOGOUT_COLOR = '#E5484D';
const APP_VERSION_LABEL = 'Phiên bản 2.4.1 (Build 1208)';

const maskPhone = (phone: string) =>
  phone.length >= 7
    ? `${phone.slice(0, 3)}****${phone.slice(-3)}`
    : phone;

const showComingSoon = () =>
  Alert.alert('Thông báo', 'Chức năng đang được phát triển');

type ProfileScreenProps = {
  onPressPersonalInfo?: () => void;
  onPressChangePassword?: () => void;
  onSignOut?: () => void;
};

export default function ProfileScreen({
  onPressPersonalInfo,
  onPressChangePassword,
  onSignOut,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationEnabled, setIsNotificationEnabled] =
    useState(true);

  useEffect(() => {
    let isActive = true;

    getProfiles()
      .then((data) => {
        if (isActive) {
          setProfile(
            data.find((item) => item.isSelf) ?? data[0] ?? null,
          );
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          Alert.alert(
            'Không thể tải hồ sơ',
            error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất tài khoản?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => onSignOut?.(),
        },
      ],
    );
  };

  const accountItems: MenuItem[] = [
    {
      id: 'personal-info',
      label: 'Thông tin cá nhân',
      Icon: UserIcon,
      onPress: () =>
        onPressPersonalInfo
          ? onPressPersonalInfo()
          : showComingSoon(),
    },
    {
      id: 'change-password',
      label: 'Thay đổi mật khẩu',
      Icon: KeyIcon,
      onPress: () => {
        if (onPressChangePassword) {
          onPressChangePassword();
        } else {
          showComingSoon();
        }
      },
    },
  ];

  const legalItems: MenuItem[] = [
    {
      id: 'terms',
      label: 'Điều khoản dịch vụ',
      Icon: FileCheckIcon,
      onPress: showComingSoon,
    },
    {
      id: 'privacy',
      label: 'Chính sách bảo mật',
      Icon: ShieldCheckIcon,
      onPress: showComingSoon,
    },
    {
      id: 'rules',
      label: 'Quy định sử dụng',
      Icon: BookOpenIcon,
      onPress: showComingSoon,
    },
  ];

  const renderMenuCard = (items: MenuItem[]) => (
    <View style={styles.card}>
      {items.map((item, index) => {
        const Icon = item.Icon;

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.row,
              index < items.length - 1 && styles.rowBorder,
            ]}
            activeOpacity={0.8}
            onPress={item.onPress}
          >
            <View style={styles.rowIcon}>
              <Icon
                size={20}
                color={COLORS.PRIMARY_LIGHT}
                strokeWidth={1.8}
              />
            </View>

            <Text style={styles.rowLabel}>
              {item.label}
            </Text>

            <ChevronRightIcon
              size={18}
              color={COLORS.ICON_MUTED}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.flex}>
      {isFocused && <StatusBar style="light" />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <LinearGradient
          colors={HEADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.header,
            { paddingTop: insets.top + 24 },
          ]}
        >
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <HeartPulseIcon
                size={46}
                color={COLORS.PRIMARY_LIGHT}
                strokeWidth={1.8}
              />
            </View>

            <View style={styles.verifiedBadge}>
              <CheckIcon
                size={12}
                color={COLORS.SURFACE}
                strokeWidth={3}
              />
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator
              color={COLORS.SURFACE}
              style={styles.loading}
            />
          ) : profile ? (
            <>
              <Text style={styles.name}>
                {profile.fullName.toUpperCase()}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {maskPhone(profile.phone)}
                </Text>

                <View style={styles.metaDot} />

                <View style={styles.codeChip}>
                  <Text style={styles.codeText}>
                    {profile.code}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.name}>
              Chưa có hồ sơ
            </Text>
          )}
        </LinearGradient>

        <View style={styles.body}>
          {renderMenuCard(accountItems)}

          <Text style={styles.sectionLabel}>
            CÀI ĐẶT
          </Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <BellIcon
                  size={20}
                  color={COLORS.PRIMARY_LIGHT}
                  strokeWidth={1.8}
                />
              </View>

              <Text style={styles.rowLabel}>
                Nhận thông báo
              </Text>

              <Switch
                value={isNotificationEnabled}
                onValueChange={setIsNotificationEnabled}
                trackColor={{
                  false: '#D5DEE9',
                  true: COLORS.PRIMARY_LIGHT,
                }}
                thumbColor={COLORS.SURFACE}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>
            THÔNG TIN PHÁP LÝ
          </Text>

          {renderMenuCard(legalItems)}

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.85}
            onPress={handleSignOut}
          >
            <LogOutIcon
              size={20}
              color={LOGOUT_COLOR}
            />

            <Text style={styles.logoutText}>
              Đăng xuất tài khoản
            </Text>
          </TouchableOpacity>

          <Text style={styles.version}>
            {APP_VERSION_LABEL}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },

  content: {
    paddingBottom: 24,
  },

  header: {
    alignItems: 'center',
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },

  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.SURFACE,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedBadge: {
    position: 'absolute',
    right: 4,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
    backgroundColor: VERIFIED_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loading: {
    marginTop: 24,
  },

  name: {
    marginTop: 14,
    fontFamily: FONTS.BOLD,
    fontSize: 22,
    letterSpacing: 0.5,
    color: COLORS.SURFACE,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },

  metaText: {
    fontFamily: FONTS.REGULAR,
    fontSize: 13,
    color: '#E3F0FB',
  },

  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E3F0FB',
  },

  codeChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },

  codeText: {
    fontFamily: FONTS.BOLD,
    fontSize: 12,
    letterSpacing: 0.5,
    color: COLORS.SURFACE,
  },

  body: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
  },

  card: {
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },

  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ICON_BOX_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowLabel: {
    flex: 1,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 14,
    color: NAVY,
  },

  sectionLabel: {
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 12,
    letterSpacing: 0.8,
    color: SECTION_LABEL_COLOR,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },

  logoutText: {
    fontFamily: FONTS.BOLD,
    fontSize: 14,
    color: LOGOUT_COLOR,
  },

  version: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    fontSize: 12,
    color: MUTED_TEXT,
  },
});
