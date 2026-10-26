import { StyleSheet, Text as RNText, View, type TextProps } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { CheckIcon } from './bookingIcons';

function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}

const TRACK_COLOR = '#DCE6F0';
const FUTURE_LABEL_COLOR = '#B6C2D2';

type BookingStepperProps = {
  steps: string[];
  currentIndex: number;
  hasCard?: boolean;
  shouldShowCurrentDot?: boolean;
};

export default function BookingStepper({
  steps,
  currentIndex,
  hasCard,
  shouldShowCurrentDot,
}: BookingStepperProps) {
  return (
    <View style={[styles.wrap, hasCard && styles.wrapCard]}>
      <View style={styles.bars}>
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <View
              key={step}
              style={[styles.bar, isCurrent && styles.barCurrent, isDone && styles.barDone]}
            >
              {isCurrent && <View style={styles.barDot} />}
            </View>
          );
        })}
      </View>

      <View style={styles.labels}>
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <View key={step} style={styles.labelCell}>
              {isCurrent && shouldShowCurrentDot && <View style={styles.currentDot} />}
              {isDone && (
                <View style={styles.checkBadge}>
                  <CheckIcon size={9} color={COLORS.SURFACE} strokeWidth={3} />
                </View>
              )}
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  isDone && styles.labelDone,
                  isCurrent && styles.labelCurrent,
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  wrapCard: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: TRACK_COLOR },
  barDone: { backgroundColor: COLORS.PRIMARY },
  barCurrent: { backgroundColor: COLORS.PRIMARY_LIGHT },
  barDot: {
    position: 'absolute',
    right: -5,
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
  },
  labels: { flexDirection: 'row', marginTop: 8 },
  labelCell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  checkBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.PRIMARY_LIGHT },
  label: { fontFamily: FONTS.SEMI_BOLD, fontSize: 11, color: FUTURE_LABEL_COLOR },
  labelDone: { color: COLORS.TEXT },
  labelCurrent: { fontFamily: FONTS.BOLD, color: COLORS.PRIMARY_LIGHT },
});