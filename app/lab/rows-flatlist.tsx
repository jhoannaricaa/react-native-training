import { Stack } from 'expo-router';

import { FlatListRows } from '@/components/lists/flat-list-rows';

/** The same 5,000 rows through FlatList at its defaults. */
export default function RowsFlatListScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'FlatList · 5,000' }} />
      <FlatListRows />
    </>
  );
}
