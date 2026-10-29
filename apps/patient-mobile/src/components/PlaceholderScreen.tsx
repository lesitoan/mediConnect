import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from './ScreenContainer';
import { COLORS, FONTS } from '../constants/theme';

type PlaceholderScreenProps = {
  title: string;
};

export default function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <LinearGradient
      colors={[COLORS.BACKGROUND_TOP, COLORS.BACKGROUND]}
      locations={[0, 0.45]}
      style={styles.flex}
    >
      <ScreenContainer style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.message}>Chức năng đang được phát triển</Text>
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingBottom: 0 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontFamily: FONTS.BOLD, fontSize: 24, lineHeight: 32, color: COLORS.PRIMARY },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { fontFamily: FONTS.REGULAR, fontSize: 14, color: COLORS.TEXT_MUTED },
});