import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, space } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.primaryGlow} />
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.ember,
    borderRadius: radius.pill,
    paddingVertical: space(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    height: 60,
    backgroundColor: colors.gold,
    opacity: 0.35,
  },
  primaryLabel: {
    color: '#1A0D06',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  ghost: {
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostLabel: {
    color: colors.textDim,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
});
