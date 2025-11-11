import { StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: palette.muted }]}>{description}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475467',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default EmptyState;
