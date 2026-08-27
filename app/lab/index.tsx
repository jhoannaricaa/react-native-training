import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function LabIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fast Refresh Lab</Text>
      <Link testID="link-case-1" href="/lab/counter-only-component" style={styles.link}>
        Case 1 — component-only export
      </Link>
      <Link testID="link-case-2" href="/lab/counter-with-theme" style={styles.link}>
        Case 2 — component + THEME export
      </Link>
      <Link testID="link-case-3" href="/lab/counter-theme-via-util" style={styles.link}>
        Case 3 — THEME consumed by a non-React util
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16, padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  link: { fontSize: 16, color: '#0a7ea4' },
});
