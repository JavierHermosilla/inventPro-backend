import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type LoadingStateProps = {
  message?: string;
};

export const LoadingState = ({ message = 'Cargando...' }: LoadingStateProps) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={palette.tint} />
      <Text style={styles.message}>{message}</Text>
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
    color: '#6B7280',
  },
});

export default LoadingState;
