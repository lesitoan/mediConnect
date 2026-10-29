import { StyleSheet, Text as RNText, TouchableOpacity, View, type TextProps } from 'react-native';
import { ArrowLeftIcon, HomeIcon } from './icons';
import { COLORS, FONTS } from '../constants/theme';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

type ScreenHeaderProps = {
  title: string;
  onPressBack?: () => void;
  onPressHome?: () => void;
};

export default function ScreenHeader({ title, onPressBack, onPressHome }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.sideButton} onPress={onPressBack} hitSlop={10}>
        <ArrowLeftIcon size={24} color={COLORS.PRIMARY_LIGHT} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <TouchableOpacity
        style={[styles.sideButton, styles.sideButtonRight]}
        onPress={onPressHome}
        hitSlop={10}
      >
        <HomeIcon size={24} color={COLORS.PRIMARY_LIGHT} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
  },
  sideButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  sideButtonRight: { alignItems: 'flex-end' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.TEXT,
  },
});