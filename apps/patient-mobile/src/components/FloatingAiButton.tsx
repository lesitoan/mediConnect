import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotColorIcon } from './featureIcons';
import { COLORS } from '../constants/theme';

type FloatingAiButtonProps = {
  onPress?: () => void;
};

export default function FloatingAiButton({ onPress }: FloatingAiButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.button, { bottom: 16 + insets.bottom }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <BotColorIcon size={30} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 10,
    elevation: 8,
  },
});
