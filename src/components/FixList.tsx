import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '../theme';

type Props = {
  fixes: string[];
};

export function FixList({ fixes }: Props) {
  const [done, setDone] = useState<boolean[]>(() => fixes.map(() => false));

  const toggle = (index: number) => {
    setDone((prev) => prev.map((value, i) => (i === index ? !value : value)));
  };

  return (
    <View style={styles.fixList}>
      {fixes.map((fix, index) => {
        const checked = done[index];
        return (
          <Pressable
            key={`${index}-${fix.slice(0, 12)}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => toggle(index)}
            style={({ pressed }) => [styles.fixCard, pressed && styles.pressed]}>
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={[styles.fixText, checked && styles.fixTextDone]}>{fix}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fixList: { gap: space(2.5) },
  fixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3.5),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space(4),
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  pressed: { opacity: 0.75 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.mint },
  checkmark: { color: '#0B0A0F', fontSize: 13, fontWeight: '900' },
  fixText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  fixTextDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
});
