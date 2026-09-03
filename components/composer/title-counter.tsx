import { StyleSheet, Text, useColorScheme } from 'react-native';

import { adaptiveColor, DANGER } from '@/constants/adaptive-colors';
import { TITLE_MAX_LENGTH } from '@/components/composer/use-note-draft';

export type TitleCounterProps = {
  length: number;
  /** Negative once the title runs past the budget. */
  remaining: number;
};

/**
 * Live character counter. Preview of Lesson 13.
 *
 * The eye gets `12/60`; a screen reader gets "48 characters left", because a slash read
 * aloud is noise. `accessibilityLiveRegion="polite"` makes Android re-announce the label
 * whenever it changes, without moving focus out of the input the user is typing in.
 *
 * The prop is Android-only in React Native — iOS has no live-region concept exposed here
 * and needs `AccessibilityInfo.announceForAccessibility` instead.
 */
/** "1 character", not "1 characters" — a screen reader reads the seam out loud. */
function plural(count: number): string {
  return `${count} character${count === 1 ? '' : 's'}`;
}

export function TitleCounter({ length, remaining }: TitleCounterProps) {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Text
      testID="title-counter"
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        remaining >= 0
          ? `${plural(remaining)} left`
          : `${plural(-remaining)} over the limit`
      }
      style={[styles.counter, { color: remaining < 0 ? DANGER : adaptiveColor('muted', scheme) }]}>
      {length}/{TITLE_MAX_LENGTH}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Tabular figures so the number does not jitter the label row as digits change width.
  counter: { fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
});
