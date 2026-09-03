import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { AppButton } from '@/components/pressables/app-button';
import { CloseGlyph } from '@/components/pressables/glyphs';
import { IconButton } from '@/components/pressables/icon-button';
import { LabSection, labStyles } from '@/components/pressables/lab-section';
import { ICON_PADDING, MIN_TOUCH_TARGET } from '@/components/pressables/press-tokens';
import { usePressCounter } from '@/components/pressables/use-press-counter';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor, DANGER } from '@/constants/adaptive-colors';
import { THEME } from '@/constants/lab-theme';

/** Half of the 44/48 box, so `escaped` puts exactly half the button outside each edge. */
const HALF = MIN_TOUCH_TARGET / 2;

export function ClippingDemo() {
  const scheme = useColorScheme() ?? 'light';
  const { counts, bump } = usePressCounter();
  const [escaped, setEscaped] = useState(true);

  const tally = (key: string) => counts[key] ?? 0;

  return (
    <ScrollView
      style={{ backgroundColor: adaptiveColor('screen', scheme) }}
      contentContainerStyle={labStyles.page}>
      <LabSection
        title="The badge that half escaped"
        note={`The close button is positioned top:-${HALF} right:-${HALF} on the card, so exactly half of it hangs outside on each of two edges. It draws fine. On iOS and Android only the overlapping quarter accepts a tap.`}>
        <AppButton
          testID="toggle-escape"
          label={escaped ? 'Fix it: keep the badge inside' : 'Break it: push the badge out'}
          variant={escaped ? 'secondary' : 'danger'}
          onPress={() => setEscaped((on) => !on)}
        />

        {/* The outer View is only a gutter so the escaped badge has somewhere to be drawn.
            It is *not* what makes the badge tappable — that is the point of the drill. */}
        <View style={styles.stage}>
          <View style={styles.card}>
            <ThemedText variant="title">Layout parity</ThemedText>
            <ThemedText variant="meta" tone="muted">
              Tap the x in its corner.
            </ThemedText>

            <IconButton
              testID="badge"
              label="Dismiss card"
              icon={<CloseGlyph color="#FFFFFF" />}
              expand="padding"
              style={[styles.badge, escaped ? { top: -HALF, right: -HALF } : { top: 4, right: 4 }]}
              onPress={() => bump('badge')}
            />
          </View>
        </View>

        <ThemedText testID="tally-badge" variant="meta" tone="muted">
          badge {tally('badge')} taps
        </ThemedText>
        <ThemedText variant="meta" tone="muted">
          Aim at the top-right corner of the x — the part outside the card. Native: nothing. Aim at
          the inner corner: it registers. This screen is running on {Platform.OS}, and on web every
          part of it registers, because DOM hit-testing does not clip to the parent. That divergence
          is why the bug ships.
        </ThemedText>
      </LabSection>

      <LabSection
        title="hitSlop is clipped by the same rule"
        note={`A 24pt button flush against the card's right edge, with ${ICON_PADDING}pt of slop on every side. The slop inside the card works. The slop past the edge is dead, because it never belonged to the card.`}>
        <View style={styles.card}>
          <ThemedText variant="meta" tone="muted" style={styles.flush}>
            flush right, slop {ICON_PADDING}
          </ThemedText>
          <IconButton
            testID="flush-slop"
            label="Dismiss, flush against the edge"
            icon={<CloseGlyph color={DANGER} />}
            expand="hitSlop"
            debug
            // Pulls the button out to the card's border, cancelling the card's 16pt
            // padding. Without this the slop would still land inside the padding and the
            // demo would quietly pass on native.
            style={styles.flushOut}
            onPress={() => bump('flush')}
          />
        </View>
        <ThemedText testID="tally-flush" variant="meta" tone="muted">
          flush {tally('flush')} taps
        </ThemedText>
      </LabSection>

      <LabSection
        title="Why"
        note="Both platforms answer 'which view owns this point?' by walking down the tree, and both refuse to descend into a subtree whose own frame does not contain the point.">
        <ThemedText variant="meta" tone="muted">
          iOS: UIView.hitTest: returns nil the moment pointInside: fails, before it ever looks at
          subviews. Android: ViewGroup.dispatchTouchEvent only offers the event to children after
          the group itself has been handed it, and it is handed only events inside its own bounds.
          clipChildren=false and overflow:&apos;visible&apos; change what is drawn, never what is
          hit — drawing and hit-testing are two different passes over the same tree.
        </ThemedText>
        <ThemedText variant="meta" tone="muted">
          So the fix is never a flag. Either the parent grows to contain the target (padding, or a
          gutter as above), or the escaping element is hoisted to a parent that is already big
          enough.
        </ThemedText>
      </LabSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Gutter equal to HALF, so the escaped badge is drawn rather than running off-screen.
  stage: { padding: HALF },
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
    rowGap: 4,
    padding: 16,
    borderRadius: THEME.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.accent,
    // Left visible on purpose. Setting it to 'hidden' would also hide the badge, which
    // makes the bug obvious; the interesting case is the one that looks correct.
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    backgroundColor: THEME.accent,
  },
  flush: { flexShrink: 1 },
  flushOut: { marginRight: -16 },
});
