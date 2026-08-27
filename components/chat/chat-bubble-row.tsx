import {
  StyleSheet,
  useColorScheme,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { adaptiveColor, UNREAD_DOT } from '@/constants/adaptive-colors';

const AVATAR_SIZE = 40;
const DOT_SIZE = 12;

/** Per-slot style seam. Used by the lab screens to knock out one fix at a time. */
export type ChatBubbleRowOverrides = {
  row?: StyleProp<ViewStyle>;
  avatarSlot?: StyleProp<ViewStyle>;
  body?: StyleProp<ViewStyle>;
  timestamp?: StyleProp<TextStyle>;
};

export type ChatBubbleRowProps = {
  author: string;
  message: string;
  timestamp: string;
  unread?: boolean;
  overrides?: ChatBubbleRowOverrides;
};

export function ChatBubbleRow({
  author,
  message,
  timestamp,
  unread = false,
  overrides,
}: ChatBubbleRowProps) {
  const scheme = useColorScheme() ?? 'light';
  const bubble = adaptiveColor('bubble', scheme);
  const screen = adaptiveColor('screen', scheme);

  return (
    <View style={[styles.row, overrides?.row]} testID="chat-row">
      {/* Difference 4: declared relative on purpose. RN defaults every view to `relative`,
          so the dot below cannot escape past this wrapper the way a CSS-absolute child
          escapes to the nearest non-static ancestor. */}
      <View style={[styles.avatarSlot, overrides?.avatarSlot]} testID="avatar-slot">
        <View style={[styles.avatar, { backgroundColor: bubble }]}>
          <ThemedText variant="meta" style={styles.avatarInitial}>
            {author.slice(0, 1).toUpperCase()}
          </ThemedText>
        </View>
        {unread ? (
          <View testID="unread-dot" style={[styles.unreadDot, { borderColor: screen }]} />
        ) : null}
      </View>

      <View style={[styles.body, { backgroundColor: bubble }, overrides?.body]} testID="chat-body">
        <ThemedText variant="meta" tone="muted">
          {author}
        </ThemedText>
        <ThemedText testID="chat-message">{message}</ThemedText>
      </View>

      <ThemedText variant="meta" tone="muted" style={[styles.timestamp, overrides?.timestamp]} testID="chat-timestamp">
        {timestamp}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    // Difference 1: RN's flexDirection defaults to `column`, CSS flex to `row`.
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  avatarSlot: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
    // Never shrink: the avatar is a fixed 40dp slot.
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: AVATAR_SIZE,
    // overflow stays visible so the dot can hang off the corner.
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    // Rounding lives here, not on avatarSlot: `overflow: 'hidden'` on the slot would
    // clip the unread dot on Android.
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontWeight: '700' },

  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: UNREAD_DOT,
    borderWidth: 2,
    // Keeps the dot over the avatar's background on Android, where paint order between an
    // absolute child and a rounded sibling is less predictable than on iOS.
    zIndex: 1,
  },

  body: {
    // Difference 2: flexShrink defaults to 1 in CSS, 0 in RN. Without the explicit 1 the
    // body refuses to give ground and pushes the timestamp off-screen.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    // Difference 3: CSS flex items get `min-width: auto` (min-content floor, so long text
    // overflows instead of wrapping). Yoga has no such floor; 0 is written for web parity.
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    rowGap: 2,
  },

  timestamp: {
    // RN already defaults flexShrink to 0; stated so the intent survives a port back to CSS,
    // where the default 1 would squash "10:24 PM" into "10:2…".
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    paddingTop: 10,
  },
});
