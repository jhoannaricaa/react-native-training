import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

console.log('[case-2] module evaluated');

/** A non-component export living in the same file as the screen. */
export const THEME = { accent: '#0a7ea4', radius: 8 };

export default function CounterWithTheme() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('[case-2] mounted');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Case 2 — component + THEME export</Text>
      <Text testID="count" style={styles.count}>
        {count}
      </Text>
      <Pressable
        testID="bump"
        style={[styles.button, { backgroundColor: THEME.accent, borderRadius: THEME.radius }]}
        onPress={() => setCount((c) => c + 1)}>
        <Text style={styles.buttonLabel}>+1</Text>
      </Pressable>
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
