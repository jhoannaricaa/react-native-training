import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { ChatBubbleRow, type ChatBubbleRowOverrides } from '@/components/chat/chat-bubble-row';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor } from '@/constants/adaptive-colors';

/*
 * The negative control for docs/layout-parity/FINDINGS.md. Each row below leaves exactly one
 * of the ported defaults at the value a property-for-property translation would inherit, so
 * the breakage can be measured instead of asserted.
 */

const MESSAGE =
  'Four hundred characters is not needed to break this; a single long sentence that cannot ' +
  'fit on one line is enough to show where the layout gives way.';

/** An unbreakable token: the only content that makes the CSS min-content floor bite. */
const TOKEN = `https://example.internal/threads/${'a'.repeat(120)}/message`;

const CASES: {
  id: string;
  label: string;
  message?: string;
  overrides?: ChatBubbleRowOverrides;
}[] = [
  {
    id: 'fixed',
    label: 'Fixed — all four differences ported',
  },
  {
    id: 'direction',
    label: "1 · flexDirection omitted → RN's column default",
    overrides: { row: { flexDirection: 'column' } },
  },
  {
    id: 'shrink',
    label: "2 · body left at RN's flexShrink: 0",
    overrides: { body: { flexShrink: 0, flexBasis: 'auto' } },
  },
  {
    id: 'static',
    label: '3 · avatar parent set to static → dot loses its anchor',
    overrides: { avatarSlot: { position: 'static' } },
  },
  {
    id: 'token',
    label: '4 · unbreakable 160-char token, minWidth dropped',
    message: TOKEN,
    // Yoga has no CSS-style min-content floor, so dropping the declaration should change
    // nothing here. On the web half of the port it is the difference between a 241 bubble
    // and a 1277 one — see the CSS control in FINDINGS.md.
    overrides: { body: { minWidth: undefined } },
  },
];

export default function ChatRowDefaults() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <ScrollView
      style={{ backgroundColor: adaptiveColor('screen', scheme) }}
      contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <ThemedText variant="title">Defaults left un-ported</ThemedText>
        <ThemedText variant="meta" tone="muted">
          One un-ported default per row. Numbers in docs/layout-parity/FINDINGS.md.
        </ThemedText>
      </View>

      {CASES.map((testCase) => (
        <View key={testCase.id} style={styles.case} testID={`case-${testCase.id}`}>
          <ThemedText variant="meta" tone="muted" style={styles.caseLabel}>
            {testCase.label}
          </ThemedText>
          <ChatBubbleRow
            author="Dao"
            message={testCase.message ?? MESSAGE}
            timestamp="10:26 PM"
            unread
            overrides={testCase.overrides}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingVertical: 16, rowGap: 28 },
  header: { paddingHorizontal: 16, rowGap: 2 },
  case: { rowGap: 4 },
  caseLabel: { paddingHorizontal: 16, fontWeight: '700' },
});
