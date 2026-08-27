import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { describeCount } from '@/components/lab/counter-label-util';
import { THEME } from '@/constants/lab-theme';

console.log('[case-3] module evaluated');

// Before: this file also did `export const THEME = ...`, and counter-label-util.ts
// imported it from here. That made this module a non-boundary AND created a require
// cycle, so every save full-reloaded the app. THEME now lives in its own module and
// this file's only export is the component.

export default function CounterThemeViaUtil() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('[case-3] mounted');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Case 3 (fixed) — THEME hoisted to its own module</Text>
      <Text testID="count" style={styles.count}>
        {count}
      </Text>
      <Pressable
        testID="bump"
        style={[styles.button, { backgroundColor: THEME.accent, borderRadius: THEME.radius }]}
        onPress={() => setCount((c) => c + 1)}>
        <Text style={styles.buttonLabel}>+1</Text>
      </Pressable>
      <Text testID="described" style={styles.marker}>
        {describeCount(count)}
      </Text>
      <Text testID="marker" style={styles.marker}>
        marker: A
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  count: { fontSize: 64, fontWeight: '700' },
  button: { paddingHorizontal: 28, paddingVertical: 12 },
  buttonLabel: { color: '#fff', fontSize: 20, fontWeight: '600' },
  marker: { fontSize: 14, color: '#687076' },
});
