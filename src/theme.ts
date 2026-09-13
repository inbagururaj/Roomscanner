import { Platform } from 'react-native';

export const colors = {
  bg: '#0B0A0F',
  surface: '#16141C',
  surfaceAlt: '#221E2B',
  border: '#302A3C',
  text: '#F7F3EE',
  textDim: '#A49DB0',
  textFaint: '#6F6880',
  ember: '#FF6B35',
  emberDeep: '#E63946',
  gold: '#FFB703',
  mint: '#4ADE80',
  overlay: 'rgba(11,10,15,0.72)',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const space = (n: number) => n * 4;

export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

export const type = {
  display: {
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '900' as const,
    letterSpacing: -1.2,
    color: colors.text,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    color: colors.text,
  },
  section: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 2,
    color: colors.textFaint,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  dim: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textDim,
  },
};
