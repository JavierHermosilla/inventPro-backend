import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const usePalette = () => {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
};

export type Palette = ReturnType<typeof usePalette>;
