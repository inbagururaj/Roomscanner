import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';

type Props = {
  title: string;
  steps: string[];
  /** Cadence of the rotating status line. */
  stepMs?: number;
};

export function WorkingScreen({ title, steps, stepMs = 2_000 }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const spinning = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2_600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    spinning.start();
    pulsing.start();
    return () => {
      spinning.stop();
      pulsing.stop();
    };
  }, [pulse, spin]);

  useEffect(() => {
    if (steps.length <= 1) return;
    const id = setInterval(
      () => setStepIndex((current) => (current + 1) % steps.length),
      stepMs,
    );
    return () => clearInterval(id);
  }, [stepMs, steps.length]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.06] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        <Animated.View style={[styles.halo, { opacity: glow, transform: [{ scale }] }]} />
        <Animated.View style={[styles.ring, { transform: [{ rotate }] }]}>
          <View style={styles.ringSpark} />
        </Animated.View>
        <Animated.View style={[styles.core, { transform: [{ scale }, { rotate: '45deg' }] }]} />
      </View>

      <Text style={[type.title, styles.title]}>{title}</Text>
      <Text style={styles.step} numberOfLines={2}>
        {steps[stepIndex] ?? ''}
      </Text>
    </View>
  );
}

const RING = 132;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(8),
    gap: space(4),
  },
  stage: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space(6),
  },
  halo: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    backgroundColor: colors.ember,
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  ringSpark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    marginTop: -6,
  },
  core: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.emberDeep,
  },
  title: { textAlign: 'center' },
  step: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    minHeight: 44,
  },
});
