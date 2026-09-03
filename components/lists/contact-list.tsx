import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  useColorScheme,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { ListRow, ROW_HEIGHT } from '@/components/lists/list-row';
import { buildRows, ROW_COUNT, ROWS, type RowItem } from '@/components/lists/row-items';
import { AppButton } from '@/components/pressables/app-button';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor } from '@/constants/adaptive-colors';
import { THEME } from '@/constants/lab-theme';

const SEPARATOR_HEIGHT = StyleSheet.hairlineWidth;
const NEW_PER_REFRESH = 3;
const FETCH_MS = 900;

const renderItem = ({ item }: ListRenderItemInfo<RowItem>) => <ListRow item={item} />;

/**
 * Explicit, though RN's default extractor would in fact find this shape: it checks
 * `item.key`, then `item.id`, then falls back to `String(index)`. Verified by removing the
 * prop and watching for the "missing keys for items" warning, which never fired.
 *
 * It stays because that fallback is silent. Rename this field to `userId` and every row is
 * suddenly keyed by its position — and this list prepends on refresh, which is precisely
 * the case where position-keyed rows hand the wrong identity to the wrong row.
 */
const keyExtractor = (item: RowItem) => item.id;

/**
 * Fixed-height rows, so the offset of row `n` is arithmetic rather than measurement. Note
 * the separator: RN's documented formula (`length * index`) is wrong the moment a list has
 * an `ItemSeparatorComponent`, and the error compounds — by row 4,999 a hairline of 0.5pt
 * puts `scrollToIndex` 2,499pt off target.
 */
const getItemLayout = (_data: ArrayLike<RowItem> | null | undefined, index: number) => ({
  length: ROW_HEIGHT,
  offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index,
  index,
});

function Separator() {
  const scheme = useColorScheme() ?? 'light';
  return <View style={[styles.separator, { backgroundColor: adaptiveColor('muted', scheme) }]} />;
}

/** Stands in for a network call, so `refreshing` is driven by something that really ends. */
function fetchNewRows(offset: number): Promise<RowItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildRows(NEW_PER_REFRESH, offset)), FETCH_MS);
  });
}

export function ContactList() {
  const scheme = useColorScheme() ?? 'light';
  const [rows, setRows] = useState<RowItem[]>(ROWS);
  const [refreshing, setRefreshing] = useState(false);
  // Where the next batch of ids starts. A ref, not state: it must not trigger a render, and
  // it must not be recomputed from `rows.length` — a future delete would then reuse an id.
  const nextOffset = useRef(ROW_COUNT);

  const onRefresh = useCallback(async () => {
    // Guard: on Android a second pull can arrive while the first is in flight.
    if (refreshing) return;
    setRefreshing(true);
    try {
      const fresh = await fetchNewRows(nextOffset.current);
      nextOffset.current += NEW_PER_REFRESH;
      setRows((previous) => [...fresh, ...previous]);
    } finally {
      // In `finally`, so a rejected fetch cannot strand the spinner on screen forever.
      setRefreshing(false);
    }
  }, [refreshing]);

  return (
    <View style={[styles.screen, { backgroundColor: adaptiveColor('screen', scheme) }]}>
      <View style={styles.panel}>
        <ThemedText testID="row-count" variant="meta" tone="muted">
          {rows.length} rows · pull down to load {NEW_PER_REFRESH} more
        </ThemedText>
        {/* react-native-web renders no pull gesture, so the same handler gets a button.
            It is not a workaround for the demo — a refresh a mouse cannot reach is a
            refresh half your users cannot reach. */}
        {Platform.OS === 'web' ? (
          <AppButton
            testID="refresh-button"
            label="Refresh"
            variant="secondary"
            loading={refreshing}
            onPress={onRefresh}
          />
        ) : null}
      </View>
      <FlatList
        testID="row-scroller"
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Separator}
        getItemLayout={getItemLayout}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // iOS colours the spinner with `tintColor`; Android takes an array in `colors`.
            // Passing only one of them leaves the other platform on its default grey.
            tintColor={THEME.accent}
            colors={[THEME.accent]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  panel: { padding: 12, rowGap: 6 },
  separator: { height: SEPARATOR_HEIGHT, opacity: 0.4, marginLeft: 60 },
});
