import { StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
};

export const SectionHeader = ({ title, subtitle, trailing }: SectionHeaderProps) => {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 2,
  },
});

export default SectionHeader;
