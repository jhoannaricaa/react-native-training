import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

console.log('[case-1] module evaluated');

export default function CounterOnlyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('[case-1] mounted');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Case 1 — component-only export</Text>
      <Text testID="count" style={styles.count}>
        {count}
      </Text>
      <Pressable testID="bump" style={styles.button} onPress={() => setCount((c) => c + 1)}>
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
  button: { backgroundColor: '#0a7ea4', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8 },
  buttonLabel: { color: '#fff', fontSize: 20, fontWeight: '600' },
  marker: { fontSize: 14, color: '#687076' },
});
