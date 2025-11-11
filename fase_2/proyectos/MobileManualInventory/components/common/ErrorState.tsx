import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';

type ErrorStateProps = {
  message?: string | null;
  onRetry?: () => void;
};

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.danger + '22',
          borderColor: palette.danger,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.danger }]}>Ocurrió un problema</Text>
      {message ? <Text style={[styles.message, { color: palette.text }]}>{message}</Text> : null}
      {onRetry ? (
        <Pressable style={[styles.button, { backgroundColor: palette.danger }]} onPress={onRetry}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default ErrorState;
