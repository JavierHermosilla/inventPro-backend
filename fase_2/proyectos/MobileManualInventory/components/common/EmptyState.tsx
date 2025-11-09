import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475467',
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default EmptyState;
