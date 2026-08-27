import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { ChatBubbleRow } from '@/components/chat/chat-bubble-row';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor } from '@/constants/adaptive-colors';

/** Exactly 400 characters — the stress case the row has to survive without overflow. */
const LONG_MESSAGE =
  'Quick status before standup: the wrapping card row is ported and the chat row now holds ' +
  'its shape under pressure, which is what this message is for, because four hundred ' +
  'characters of uninterrupted prose is exactly the sort of payload that used to shove the ' +
  'timestamp clean off the right edge of the screen on a narrow phone held in portrait, and ' +
  'yet it stays wrapped now, down to the last full stop.';

const MESSAGES = [
  { author: 'Rin', message: 'Ported the card row. Same layout on both.', timestamp: '10:24 PM' },
  { author: 'Dao', message: LONG_MESSAGE, timestamp: '10:26 PM', unread: true },
  { author: 'Mai', message: 'Unread dot sits on the avatar, not on a margin.', timestamp: '10:31 PM' },
];

export default function ChatBubbleRowScreen() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <ScrollView
      style={{ backgroundColor: adaptiveColor('screen', scheme) }}
      contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <ThemedText variant="title">Chat bubble row</ThemedText>
        <ThemedText variant="meta" tone="muted">
          40dp avatar · growing body · fixed timestamp · absolute unread dot
        </ThemedText>
      </View>

      {MESSAGES.map((item) => (
        <ChatBubbleRow key={item.author} {...item} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingVertical: 16, rowGap: 12 },
  header: { paddingHorizontal: 16, rowGap: 2 },
});
