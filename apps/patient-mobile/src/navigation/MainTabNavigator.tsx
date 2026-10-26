import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
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

const HAS_UNREAD_NOTIFICATIONS = true;

const FEATURE_ROUTES = {
  booking: ROOT_ROUTES.BOOKING_PROFILE,
  'booking-history': ROOT_ROUTES.APPOINTMENT_HISTORY,
  chatbot: ROOT_ROUTES.AI_CHAT,
  'health-record': ROOT_ROUTES.HEALTH_RECORD,
  rating: ROOT_ROUTES.RATING,
  payment: ROOT_ROUTES.PAYMENT,
  invoice: ROOT_ROUTES.INVOICE_LIST,
  search: ROOT_ROUTES.SEARCH,
} as const;

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = {
  Icon: IconComponent;
  color: string;
  showDot?: boolean;
};

function TabIcon({ Icon, color, showDot }: TabIconProps) {
  return (
    <View>
      <Icon size={24} color={color} strokeWidth={1.8} />
      {showDot && <View style={styles.dot} />}
    </View>
  );
}

function HomeTab() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePressFeature = (key: string) => {
    const route = FEATURE_ROUTES[key as keyof typeof FEATURE_ROUTES];
    if (route) {
      navigation.navigate(route as never);
    }
  };

  const handlePressSearch = () => {
    navigation.navigate(ROOT_ROUTES.SEARCH as never);
  };

  return <HomeScreen onPressFeature={handlePressFeature} onPressSearch={handlePressSearch} />;
}

export default function MainTabNavigator() {
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
            <TabIcon Icon={BellIcon} color={color} showDot={HAS_UNREAD_NOTIFICATIONS} />
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
        {() => <PlaceholderScreen title="Cá nhân" />}
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
  dot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.BADGE_RED,
    borderWidth: 1.5,
    borderColor: COLORS.SURFACE,
  },
});