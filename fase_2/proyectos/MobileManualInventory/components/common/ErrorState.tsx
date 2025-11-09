import { Pressable, StyleSheet, Text, View } from 'react-native';

type ErrorStateProps = {
  message?: string | null;
  onRetry?: () => void;
};

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>Ocurrió un problema</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {onRetry ? (
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Reintentar</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  message: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
  },
  button: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#991B1B',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default ErrorState;
