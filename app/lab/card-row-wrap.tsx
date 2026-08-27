import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { adaptiveColor } from '@/constants/adaptive-colors';

/*
 * Part 1 — the web original this file ports:
 *
 *   .card-row {
 *     display: flex;
 *     flex-wrap: wrap;
 *     align-content: flex-start;
 *     gap: 12px 16px;
 *     padding: 16px;
 *     height: 320px;
 *   }
 *   .card {
 *     flex: 0 1 140px;
 *     padding: 12px;
 *     border-radius: 8px;
 *   }
 *
 * Every rewrite is annotated in the StyleSheet below. See docs/layout-parity/FINDINGS.md.
 */

const CARDS = [
  { title: 'Inbox', body: 'Wraps at 140dp.' },
  { title: 'Drafts', body: 'Grow 0, shrink 1.' },
  { title: 'Sent', body: 'Row gap 12.' },
  { title: 'Archive', body: 'Column gap 16.' },
  { title: 'Spam', body: 'Rows hug the top.' },
  { title: 'Trash', body: 'Unitless, not px.' },
];

export default function CardRowWrap() {
  const scheme = useColorScheme() ?? 'light';
  const screen = adaptiveColor('screen', scheme);
  const bubble = adaptiveColor('bubble', scheme);

  return (
    <ScrollView style={{ backgroundColor: screen }} contentContainerStyle={styles.page}>
      <ThemedText variant="title">Wrapping card row</ThemedText>
      <ThemedText variant="meta" tone="muted">
        Ported from CSS flexbox. Identical on iOS, Android and web.
      </ThemedText>

      {/* The border is only here to make the fixed 320 height visible: the rows sit against
          the top of the box and the slack is left at the bottom, which is what
          alignContent: 'flex-start' buys. */}
      <View style={[styles.cardRow, { borderColor: adaptiveColor('muted', scheme) }]} testID="card-row">
        {CARDS.map((card) => (
          <View key={card.title} style={[styles.card, { backgroundColor: bubble }]} testID="card">
            <ThemedText variant="meta" style={styles.cardTitle}>
              {card.title}
            </ThemedText>
            <ThemedText variant="meta" tone="muted">
              {card.body}
            </ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, rowGap: 8 },

  cardRow: {
    // `display: flex` has no counterpart — every RN View is already a flex container. What
    // does need writing is the direction: RN defaults to `column`, CSS flex to `row`.
    flexDirection: 'row',
    flexWrap: 'wrap',
    // CSS defaults align-content to `stretch`, Yoga to `flex-start`. The original said
    // flex-start, so the values agree here — but it is written out because omitting it means
    // two different layouts the moment the snippet changes.
    alignContent: 'flex-start',
    // `gap: 12px 16px` is a shorthand RN does not parse; RN's `gap` takes one number only.
    rowGap: 12,
    columnGap: 16,
    // px becomes a unitless density-independent number.
    padding: 16,
    // align-content only has room to act when the container is taller than its rows.
    height: 320,
    borderWidth: 1,
    borderRadius: 12,
    // box-sizing: border-box is the only box model RN has, so the padding is already inside
    // the 320 — no rewrite needed, and no `box-sizing` line to port.
  },

  card: {
    // `flex: 0 1 160px` cannot be written as RN's `flex: n`: that shorthand means
    // grow n / shrink 1 / basis 0%, which would stretch the cards. Expanded longhand:
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 140,
    padding: 12,
    borderRadius: 8,
    rowGap: 2,
  },
  cardTitle: { fontWeight: '700' },
});
