import { StyleSheet, View } from 'react-native';

import { ICON_SIZE } from '@/components/pressables/press-tokens';

/**
 * Glyphs drawn out of Views rather than pulled from an icon font.
 *
 * Two reasons. No icon dependency is installed, and — more to the point — a font glyph's
 * drawn size is a function of `fontSize`, line height and the font's own metrics, so
 * "24x24" would be an approximation. A View box is exactly 24x24, which is what the
 * touch-target arithmetic in `press-tokens.ts` is measured against.
 */

type GlyphProps = { color: string };

/** Bars are 18 long inside the 24 box, leaving a 3pt optical margin on each side. */
const BAR_LENGTH = 18;
const BAR_THICKNESS = 2;

export function PlusGlyph({ color }: GlyphProps) {
  return (
    <View style={styles.box}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.upright, { backgroundColor: color }]} />
    </View>
  );
}

export function CloseGlyph({ color }: GlyphProps) {
  return (
    <View style={styles.box}>
      <View style={[styles.bar, styles.rotated, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.counterRotated, { backgroundColor: color }]} />
    </View>
  );
}

export function MinusGlyph({ color }: GlyphProps) {
  return (
    <View style={styles.box}>
      <View style={[styles.bar, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Absolute so the two bars of a `+` or `x` stack on the same centre instead of
  // laying out side by side.
  bar: {
    position: 'absolute',
    width: BAR_LENGTH,
    height: BAR_THICKNESS,
    borderRadius: BAR_THICKNESS / 2,
  },
  upright: { width: BAR_THICKNESS, height: BAR_LENGTH },
  rotated: { transform: [{ rotate: '45deg' }] },
  counterRotated: { transform: [{ rotate: '-45deg' }] },
});
