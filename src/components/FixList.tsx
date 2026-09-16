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
            style={({ pressed }) => [
              styles.fixCard,
              checked && styles.fixCardDone,
              pressed && styles.pressed,
            ]}>
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
  fixList: { gap: space(3) },
  fixCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space(3.5),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space(4.5),
    paddingHorizontal: space(4.5),
  },
  fixCardDone: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 4,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space(0.5),
  },
  checkboxChecked: { backgroundColor: colors.mint, borderColor: colors.mint },
  checkmark: { color: colors.bg, fontSize: 13, fontWeight: '900' },
  fixText: { flex: 1, color: colors.text, fontSize: 15.5, lineHeight: 23 },
  fixTextDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
    opacity: 0.75,
  },
});
