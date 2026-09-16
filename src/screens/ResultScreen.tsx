import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/Buttons';
import { FixList } from '../components/FixList';
import { PERSONA } from '../config';
import { colors, radius, space } from '../theme';
import type { RoastResult } from '../types';

type Props = {
  result: RoastResult;
  onRestart: () => void;
};

function scoreColor(score: number): string {
  if (score < 4) return colors.emberDeep;
  if (score < 8) return colors.gold;
  return colors.mint;
}

function useCountUp(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

export function ResultScreen({ result, onRestart }: Props) {
  const reveal = useRef(new Animated.Value(0)).current;
  const tokenCount = useCountUp(result.tokensUsed);

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
          <Text style={styles.kicker}>Verdict</Text>

          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNumber, { color: scoreColor(result.score) }]}>
              {result.score}
              <Text style={styles.scoreMax}>/10</Text>
            </Text>
            <Text style={styles.tokenCounter}>{tokenCount.toLocaleString()} tokens</Text>
          </View>

          <View style={styles.roastCard}>
            <Text style={styles.quoteGlyph}>“</Text>
            <Text style={styles.roastText}>{result.roast}</Text>
            <View style={styles.attributionRow}>
              <View style={styles.rule} />
              <Text style={styles.attribution}>{PERSONA}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>{result.fixes.length} fixes, cheap and fast</Text>

          <FixList fixes={result.fixes} />

          <Text style={styles.wipedText}>
            Video and frames deleted from this device. Nothing was stored on the server.
          </Text>
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
  scroll: { paddingHorizontal: space(6), paddingTop: space(6), paddingBottom: space(6) },

  kicker: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: space(2),
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: space(7),
  },
  scoreNumber: { fontSize: 76, fontWeight: '900', letterSpacing: -3, lineHeight: 76 },
  scoreMax: { fontSize: 22, fontWeight: '700', color: colors.textFaint },
  tokenCounter: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textFaint,
    marginBottom: space(1.5),
  },

  roastCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(6),
    paddingTop: space(6),
    paddingBottom: space(6),
  },
  quoteGlyph: {
    color: colors.ember,
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: space(1),
  },
  roastText: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2.5),
    marginTop: space(5),
  },
  rule: { width: 20, height: 1, backgroundColor: colors.ember },
  attribution: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  sectionLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: space(9),
    marginBottom: space(3.5),
  },

  wipedText: {
    color: colors.textFaint,
    fontSize: 12,
    lineHeight: 17,
    marginTop: space(8),
  },

  footer: {
    paddingHorizontal: space(6),
    paddingTop: space(3),
    paddingBottom: space(8),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
