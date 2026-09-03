import { Stack } from 'expo-router';

import { ScrollViewRows } from '@/components/lists/scroll-view-rows';

/** 5,000 rows, no windowing: every row mounted before the first one is visible. */
export default function RowsScrollViewScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ScrollView · 5,000' }} />
      <ScrollViewRows />
    </>
  );
}
