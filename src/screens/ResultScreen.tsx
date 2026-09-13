import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/Buttons';
import { PERSONA } from '../config';
import { colors, radius, space, type } from '../theme';
import type { RoastResult } from '../types';

type Props = {
  result: RoastResult;
  onRestart: () => void;
};

export function ResultScreen({ result, onRestart }: Props) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  const lift = reveal.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: reveal, transform: [{ translateY: lift }] }}>
          <Text style={styles.kicker}>THE VERDICT</Text>
          <Text style={[type.display, styles.headline]}>Roasted.</Text>

          <View style={styles.roastCard}>
            <View style={styles.quoteMark}>
              <Text style={styles.quoteGlyph}>“</Text>
            </View>
            <Text style={styles.roastText}>{result.roast}</Text>
            <View style={styles.attributionRow}>
              <View style={styles.rule} />
              <Text style={styles.attribution}>{PERSONA}</Text>
            </View>
          </View>

          <Text style={[type.section, styles.sectionLabel]}>
            {result.fixes.length} FIXES THAT WON'T BANKRUPT YOU
          </Text>

          <View style={styles.fixList}>
            {result.fixes.map((fix, index) => (
              <View key={`${index}-${fix.slice(0, 12)}`} style={styles.fixCard}>
                <View style={styles.fixNumber}>
                  <Text style={styles.fixNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.fixText}>{fix}</Text>
              </View>
            ))}
          </View>

          <View style={styles.wipedRow}>
            <View style={styles.wipedDot} />
            <Text style={styles.wipedText}>
              Video and frames deleted from this device. Nothing was stored on the server.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Roast another room" onPress={onRestart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space(6), paddingTop: space(5), paddingBottom: space(6) },

  kicker: { color: colors.ember, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  headline: { marginTop: space(1), marginBottom: space(6) },

  roastCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(5),
    paddingTop: space(7),
    paddingBottom: space(5),
  },
  quoteMark: { position: 'absolute', top: space(1), left: space(4) },
  quoteGlyph: {
    color: colors.ember,
    fontSize: 64,
    lineHeight: 64,
    fontWeight: '900',
    opacity: 0.45,
  },
  roastText: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 29,
    fontWeight: '500',
  },
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2.5),
    marginTop: space(5),
  },
  rule: { width: 24, height: 1, backgroundColor: colors.ember },
  attribution: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  sectionLabel: { marginTop: space(8), marginBottom: space(3) },
  fixList: { gap: space(2.5) },
  fixCard: {
    flexDirection: 'row',
    gap: space(3.5),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space(4),
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  fixNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixNumberText: { color: '#241700', fontSize: 13, fontWeight: '900' },
  fixText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },

  wipedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2.5),
    marginTop: space(7),
    paddingHorizontal: space(1),
  },
  wipedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.mint },
  wipedText: { flex: 1, color: colors.textFaint, fontSize: 12, lineHeight: 17 },

  footer: {
    paddingHorizontal: space(6),
    paddingTop: space(3),
    paddingBottom: space(8),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
