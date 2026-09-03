import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { CloseGlyph, MinusGlyph, PlusGlyph } from '@/components/pressables/glyphs';
import { IconButton } from '@/components/pressables/icon-button';
import { LabSection, labStyles } from '@/components/pressables/lab-section';
import { ICON_PADDING, ICON_SIZE, MIN_TOUCH_TARGET } from '@/components/pressables/press-tokens';
import { AppButton } from '@/components/pressables/app-button';
import { usePressCounter } from '@/components/pressables/use-press-counter';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor } from '@/constants/adaptive-colors';
import { THEME } from '@/constants/lab-theme';

type Box = { width: number; height: number };

export function IconTargetDemo() {
  const scheme = useColorScheme() ?? 'light';
  const { counts, bump } = usePressCounter();
  const [debug, setDebug] = useState(true);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});

  const tally = (key: string) => counts[key] ?? 0;
  const measure = (key: string) => (event: { nativeEvent: { layout: Box } }) => {
    const { width, height } = event.nativeEvent.layout;
    setBoxes((prev) => ({
      ...prev,
      [key]: { width: Math.round(width), height: Math.round(height) },
    }));
  };
  const box = (key: string) => {
    const measured = boxes[key];
    return measured === undefined ? '—' : `${measured.width}x${measured.height}`;
  };

  return (
    <ScrollView
      style={{ backgroundColor: adaptiveColor('screen', scheme) }}
      contentContainerStyle={labStyles.page}>
      <LabSection
        title={`Target floor on this platform: ${MIN_TOUCH_TARGET}`}
        note={`${Platform.OS} — 48 is Android's accessibility floor, 44 is Apple's HIG minimum. The glyph is ${ICON_SIZE}x${ICON_SIZE} in every case below.`}>
        <AppButton
          testID="toggle-debug"
          label={debug ? 'Hide target outlines' : 'Show target outlines'}
          variant="secondary"
          onPress={() => setDebug((on) => !on)}
        />
      </LabSection>

      <LabSection
        title="Three ways to ship a 24pt glyph"
        note="Left to right: no expansion (the bug), padding (real layout), hitSlop (native only). The dashed outline is the effective target.">
        {/* Each button sits in a `slot` big enough to contain its slop. That is not
            cosmetic: on native the slop of the third button would be clipped by any
            ancestor smaller than 44pt, which is the subject of the clipping screen. */}
        <View style={[labStyles.row, styles.targetRow]}>
          <View style={styles.cell}>
            <View style={styles.slot}>
              <IconButton
                testID="icon-naive"
                label="Add, untouched 24pt box"
                icon={<PlusGlyph color={THEME.accent} />}
                expand="hitSlop"
                hitSlopOverride={0}
                debug={debug}
                onLayout={measure('naive')}
                onPress={() => bump('naive')}
              />
            </View>
            <ThemedText testID="box-naive" variant="meta" tone="muted">
              none · {box('naive')}
            </ThemedText>
            <ThemedText testID="tally-naive" variant="meta" tone="muted">
              {tally('naive')} taps
            </ThemedText>
          </View>

          <View style={styles.cell}>
            <View style={styles.slot}>
              <IconButton
                testID="icon-padded"
                label="Remove, padded to target"
                icon={<MinusGlyph color={THEME.accent} />}
                expand="padding"
                debug={debug}
                onLayout={measure('padded')}
                onPress={() => bump('padded')}
              />
            </View>
            <ThemedText testID="box-padded" variant="meta" tone="muted">
              padding · {box('padded')}
            </ThemedText>
            <ThemedText testID="tally-padded" variant="meta" tone="muted">
              {tally('padded')} taps
            </ThemedText>
          </View>

          <View style={styles.cell}>
            <View style={styles.slot}>
              <IconButton
                testID="icon-slop"
                label="Close, target via hitSlop"
                icon={<CloseGlyph color={THEME.accent} />}
                expand="hitSlop"
                debug={debug}
                onLayout={measure('slop')}
                onPress={() => bump('slop')}
              />
            </View>
            <ThemedText testID="box-slop" variant="meta" tone="muted">
              hitSlop · {box('slop')}
            </ThemedText>
            <ThemedText testID="tally-slop" variant="meta" tone="muted">
              {tally('slop')} taps
            </ThemedText>
          </View>
        </View>

        <ThemedText variant="meta" tone="muted">
          The measured box is the Pressable&apos;s real layout. Only the padding build reports{' '}
          {MIN_TOUCH_TARGET}x{MIN_TOUCH_TARGET}; the hitSlop build still measures {ICON_SIZE}x
          {ICON_SIZE} because slop is not layout — which is exactly why a screenshot alone cannot
          prove it and the tap counter has to.
        </ThemedText>
      </LabSection>

      <LabSection
        title="In place, at real density"
        note={`The padded button inside a row it has to share. Negative margin keeps the ${MIN_TOUCH_TARGET}pt box from pushing the title around.`}>
        <View style={styles.card}>
          <ThemedText variant="title" style={styles.cardTitle}>
            Ported the chat row
          </ThemedText>
          <IconButton
            testID="icon-in-row"
            label="Dismiss note"
            icon={<CloseGlyph color={THEME.accent} />}
            expand="padding"
            debug={debug}
            // The whole point of padding-as-target: it occupies space. Pulling that space
            // back with a negative margin keeps the optical alignment a designer asked for
            // while leaving the touch area intact.
            style={styles.trailing}
            onPress={() => bump('inRow')}
          />
        </View>
        <ThemedText testID="tally-in-row" variant="meta" tone="muted">
          dismiss {tally('inRow')} taps
        </ThemedText>
      </LabSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  targetRow: { paddingVertical: 8, columnGap: 20, justifyContent: 'center' },
  cell: { alignItems: 'center', rowGap: 6 },
  // Bigger than the target on every side, so the third button's slop — and the dashed
  // outline that stands for it — has somewhere legal to be. Fixed size, so all three
  // buttons and all three captions line up despite boxes of 24, 44 and 24.
  slot: {
    width: MIN_TOUCH_TARGET + 2 * ICON_PADDING,
    height: MIN_TOUCH_TARGET + 2 * ICON_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: THEME.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.accent,
  },
  cardTitle: { flexShrink: 1 },
  trailing: { marginVertical: -8, marginRight: -6 },
});
