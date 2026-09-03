import { memo } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { type RowItem } from '@/components/lists/row-items';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor } from '@/constants/adaptive-colors';

/** Fixed, and exported: `getItemLayout` in the converted list is arithmetic over it. */
export const ROW_HEIGHT = 56;

export type ListRowProps = { item: RowItem };

/**
 * Four views and two text nodes — enough that 5,000 of them cost something real, small
 * enough that the cost is the list's and not the row's.
 *
 * `memo` is kept even with the React Compiler on: the compiler memoizes values inside a
 * component, but a FlatList cell re-renders when its own props change identity, and
 * `memo` is what makes the identity check happen at the boundary.
 */
export const ListRow = memo(function ListRow({ item }: ListRowProps) {
  const scheme = useColorScheme() ?? 'light';

  return (
    <View testID="list-row" style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: adaptiveColor('bubble', scheme) }]}>
        <ThemedText variant="meta">{item.name.slice(0, 1)}</ThemedText>
      </View>
      <View style={styles.text}>
        <ThemedText numberOfLines={1}>{item.name}</ThemedText>
        <ThemedText variant="meta" tone="muted">
          {item.id}
        </ThemedText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flexShrink: 1, rowGap: 2 },
});
