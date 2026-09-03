import { useRef } from 'react';
import { FlatList, StyleSheet, useColorScheme, View, type ListRenderItemInfo } from 'react-native';

import { ListRow } from '@/components/lists/list-row';
import { PerfReadout } from '@/components/lists/perf-readout';
import { ROW_COUNT, ROWS, type RowItem } from '@/components/lists/row-items';
import { now } from '@/components/lists/use-perf-clock';
import { adaptiveColor } from '@/constants/adaptive-colors';

// Hoisted to module scope: a new function identity on every render defeats the memoisation
// FlatList does on its cells. Neither closes over anything, so neither needs to be a hook.
const renderItem = ({ item }: ListRenderItemInfo<RowItem>) => <ListRow item={item} />;
const keyExtractor = (item: RowItem) => item.id;

/**
 * The same 5,000 rows through FlatList, at its defaults — no `getItemLayout`, no tuned
 * window. The point of the comparison is what you get without doing anything clever.
 */
export function FlatListRows() {
  const startedAt = useRef(now()).current;
  const scheme = useColorScheme() ?? 'light';

  return (
    <View style={[styles.screen, { backgroundColor: adaptiveColor('screen', scheme) }]}>
      <PerfReadout startedAt={startedAt} label={`FlatList · ${ROW_COUNT} rows`} />
      <FlatList
        testID="row-scroller"
        data={ROWS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
