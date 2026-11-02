import { StyleSheet, Text as RNText, View } from 'react-native';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import HealthRecordScreen from '../screens/records/HealthRecordScreen';
import ProfileScreen from '../screens/users/ProfileScreen';
import PlaceholderScreen from '../components/PlaceholderScreen';
import {
  BellIcon,
  HomeIcon,
  LayersIcon,
  UserIcon,
  type IconComponent,
} from '../components/icons';
import { COLORS, FONTS } from '../constants/theme';
import { MAIN_TABS, ROOT_ROUTES } from './routes';
import type { MainTabParamList, RootStackParamList } from './types';

const UNREAD_NOTIFICATION_COUNT = 9;
const MAX_BADGE_COUNT = 9;

const FEATURE_ROUTES = {
  booking: ROOT_ROUTES.BOOKING_PROFILE,
  'booking-history': ROOT_ROUTES.APPOINTMENT_HISTORY,
  chatbot: ROOT_ROUTES.AI_CHAT,
  'health-record': MAIN_TABS.HEALTH_RECORD,
  rating: ROOT_ROUTES.RATING,
  payment: ROOT_ROUTES.PAYMENT,
  invoice: ROOT_ROUTES.INVOICE_LIST,
  search: ROOT_ROUTES.SEARCH,
} as const;

type TabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = {
  Icon: IconComponent;
  color: string;
  badgeCount?: number;
};

function TabIcon({ Icon, color, badgeCount }: TabIconProps) {
  return (
    <View>
      <Icon size={24} color={color} strokeWidth={1.8} />
      {badgeCount ? (
        <View style={styles.badge}>
          <RNText allowFontScaling={false} style={styles.badgeText}>
            {badgeCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : badgeCount}
          </RNText>
        </View>
      ) : null}
    </View>
  );
}

function HomeTab() {
  const navigation = useNavigation<TabNavigation>();

  const handlePressFeature = (key: string) => {
    const route = FEATURE_ROUTES[key as keyof typeof FEATURE_ROUTES];
    if (route) {
      navigation.navigate(route as never);
    }
  };

  const handlePressSearch = () => {
    navigation.navigate(ROOT_ROUTES.SEARCH as never);
  };

  const handlePressAiChat = () => {
    navigation.navigate(ROOT_ROUTES.AI_CHAT as never);
  };

  return <HomeScreen onPressFeature={handlePressFeature} onPressSearch={handlePressSearch} onPressAiChat={handlePressAiChat} />;
}

type ProfileTabProps = {
  onSignOut?: () => void;
};

function ProfileTab({ onSignOut }: ProfileTabProps) {
  const navigation = useNavigation<TabNavigation>();

  return (
    <ProfileScreen
      onPressPersonalInfo={() => navigation.navigate(ROOT_ROUTES.PERSONAL_INFO as never)}
      onPressChangePassword={() => navigation.navigate(ROOT_ROUTES.CHANGE_PASSWORD as never) } 
      onSignOut={onSignOut}
    />
  );
}

type MainTabNavigatorProps = {
  onSignOut?: () => void;
};

export default function MainTabNavigator({ onSignOut }: MainTabNavigatorProps) {
  return (
    <Tab.Navigator
      initialRouteName={MAIN_TABS.HOME}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.ICON_MUTED,
        tabBarLabelStyle: styles.tabLabel,
        tabBarAllowFontScaling: false,
        tabBarStyle: styles.tabBar,
        sceneStyle: { backgroundColor: COLORS.BACKGROUND },
      }}
    >
      <Tab.Screen
        name={MAIN_TABS.HOME}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <TabIcon Icon={HomeIcon} color={color} />,
        }}
      >
        {() => <HomeTab />}
      </Tab.Screen>

      <Tab.Screen
        name={MAIN_TABS.NOTIFICATIONS}
        options={{
          tabBarLabel: 'Thông báo',
          tabBarIcon: ({ color }) => (
            <TabIcon Icon={BellIcon} color={color} badgeCount={UNREAD_NOTIFICATION_COUNT} />
          ),
        }}
      >
        {() => <PlaceholderScreen title="Thông báo" />}
      </Tab.Screen>

      <Tab.Screen
        name={MAIN_TABS.FUNCTIONS}
        options={{
          tabBarLabel: 'Chức năng',
          tabBarIcon: ({ color }) => <TabIcon Icon={LayersIcon} color={color} />,
        }}
      >
        {() => <PlaceholderScreen title="Chức năng" />}
      </Tab.Screen>

      <Tab.Screen
        name={MAIN_TABS.PROFILE}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color }) => <TabIcon Icon={UserIcon} color={color} />,
        }}
      >
        {() => <ProfileTab onSignOut={onSignOut} />}
      </Tab.Screen>

      <Tab.Screen name={MAIN_TABS.HEALTH_RECORD} options={{ tabBarItemStyle: styles.hiddenTab }}>
        {({ navigation }) => (
          <HealthRecordScreen onPressBack={() => navigation.navigate(MAIN_TABS.HOME)} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.BORDER,
  },
  tabLabel: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11 },
  hiddenTab: { display: 'none' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.BADGE_RED,
    borderWidth: 1.5,
    borderColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: FONTS.BOLD, fontSize: 10, lineHeight: 13, color: COLORS.SURFACE },
});