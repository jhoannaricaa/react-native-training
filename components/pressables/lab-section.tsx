import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** Section heading + caption + content. Shared by the three pressables lab screens. */
export function LabSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText variant="title">{title}</ThemedText>
      {note !== undefined ? (
        <ThemedText variant="meta" tone="muted">
          {note}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

export const labStyles = StyleSheet.create({
  page: { padding: 16, rowGap: 28 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 12,
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  section: { rowGap: 10 },
});
