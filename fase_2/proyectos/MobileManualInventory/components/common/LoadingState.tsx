import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';

type LoadingStateProps = {
  message?: string;
};

export const LoadingState = ({ message = 'Cargando...' }: LoadingStateProps) => {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={palette.tint} />
      <Text style={[styles.message, { color: palette.muted }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  message: {
    fontSize: 14,
  },
});

export default LoadingState;
