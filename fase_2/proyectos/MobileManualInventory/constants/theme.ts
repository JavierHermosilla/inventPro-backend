/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const PRIMARY = '#005B8F';
const SECONDARY = '#00A8B8';
const ACCENT = '#FFC857';
const SUCCESS = '#0EAD69';
const WARNING = '#F49D37';
const DANGER = '#E63946';
const SURFACE_LIGHT = '#FFFFFF';
const SURFACE_MUTED = '#F3F6FB';
const SURFACE_DARK = '#0E1116';

export const Colors = {
  light: {
    text: '#12181F',
    background: SURFACE_MUTED,
    tint: PRIMARY,
    icon: '#5B6472',
    card: SURFACE_LIGHT,
    border: '#E1E6EF',
    muted: '#7D8696',
    tabIconDefault: '#8B99AE',
    tabIconSelected: PRIMARY,
    success: SUCCESS,
    warning: WARNING,
    danger: DANGER,
    accent: ACCENT,
  },
  dark: {
    text: '#F4F6FA',
    background: SURFACE_DARK,
    tint: SECONDARY,
    icon: '#BCC6D2',
    card: '#161B23',
    border: '#2D3645',
    muted: '#96A0B2',
    tabIconDefault: '#657085',
    tabIconSelected: SECONDARY,
    success: '#4ADE80',
    warning: '#FDBA74',
    danger: '#F87171',
    accent: '#FACC15',
  },
} as const;

export const SemanticColors = {
  primary: PRIMARY,
  secondary: SECONDARY,
  accent: ACCENT,
  success: SUCCESS,
  warning: WARNING,
  danger: DANGER,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
