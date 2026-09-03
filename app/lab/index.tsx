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

      <Text style={styles.title}>Layout Parity Lab</Text>
      <Link testID="link-card-row" href="/lab/card-row-wrap" style={styles.link}>
        Part 1 — wrapping card row, ported from CSS
      </Link>
      <Link testID="link-chat-row" href="/lab/chat-bubble-row" style={styles.link}>
        Part 2 — chat bubble row
      </Link>
      <Link testID="link-chat-defaults" href="/lab/chat-row-defaults" style={styles.link}>
        Part 2 — the same row with defaults left un-ported
      </Link>

      <Text style={styles.title}>Keyboard & Forms Lab</Text>
      <Link testID="link-note-composer" href="/lab/note-composer" style={styles.link}>
        FieldKit — note composer
      </Link>

      <Text style={styles.title}>Pressables & Touch Targets Lab</Text>
      <Link testID="link-press-kit" href="/lab/press-kit" style={styles.link}>
        AppButton — variants, blocked states, press latency
      </Link>
      <Link testID="link-icon-target" href="/lab/icon-target" style={styles.link}>
        A 24pt glyph that reaches 44/48
      </Link>
      <Link testID="link-clipping" href="/lab/hit-target-clipping" style={styles.link}>
        Bug repro — a target outside its parent&apos;s bounds
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 14, padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  link: { fontSize: 16, color: '#0a7ea4' },
});
