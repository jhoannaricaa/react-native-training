import { useRef } from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { ListRow } from '@/components/lists/list-row';
import { PerfReadout } from '@/components/lists/perf-readout';
import { ROW_COUNT, ROWS } from '@/components/lists/row-items';
import { now } from '@/components/lists/use-perf-clock';
import { adaptiveColor } from '@/constants/adaptive-colors';

/**
 * 5,000 rows in a ScrollView. Every row is a real element, a real host view and — on web —
 * real DOM, whether or not it is anywhere near the viewport. ScrollView has no windowing;
 * `children` is the whole list, and mounting it is mounting all of it.
 *
 * `removeClippedSubviews` is left at its default (`false`). It is not windowing: it only
 * detaches native views that are already mounted, which does nothing for the mount cost
 * measured here, and on Android it has a history of blanking rows.
 */
export function ScrollViewRows() {
  // Read in the render body, so the clock starts before any row renders.
  const startedAt = useRef(now()).current;
  const scheme = useColorScheme() ?? 'light';

  return (
    <View style={[styles.screen, { backgroundColor: adaptiveColor('screen', scheme) }]}>
      <PerfReadout startedAt={startedAt} label={`ScrollView · ${ROW_COUNT} rows`} />
      <ScrollView testID="row-scroller">
        {ROWS.map((item) => (
          <ListRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
