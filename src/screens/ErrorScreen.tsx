import { StyleSheet, Text, View } from 'react-native';

import { GhostButton, PrimaryButton } from '../components/Buttons';
import { colors, radius, space, type } from '../theme';

type Props = {
  message: string;
  onRetry?: () => void;
  onRestart: () => void;
};

export function ErrorScreen({ message, onRetry, onRestart }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <View style={styles.mark}>
          <Text style={styles.markGlyph}>!</Text>
        </View>
        <Text style={[type.title, styles.title]}>The roast burned</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.footer}>
        {onRetry ? <PrimaryButton label="Try again" onPress={onRetry} /> : null}
        <GhostButton label="Start over" onPress={onRestart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(8),
    gap: space(3),
  },
  mark: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.emberDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space(3),
  },
  markGlyph: { color: colors.emberDeep, fontSize: 28, fontWeight: '900' },
  title: { textAlign: 'center' },
  message: { color: colors.textDim, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  footer: {
    paddingHorizontal: space(6),
    paddingBottom: space(8),
    gap: space(2.5),
  },
});
