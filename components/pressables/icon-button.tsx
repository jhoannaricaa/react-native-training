import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import {
  BLOCKED_OPACITY,
  ICON_PADDING,
  ICON_SIZE,
  MIN_TOUCH_TARGET,
  PRESSED_OPACITY,
  USES_RIPPLE,
} from '@/components/pressables/press-tokens';
import { THEME } from '@/constants/lab-theme';

/**
 * How the 24pt glyph reaches a 44/48 target.
 *
 * - `padding`  — the Pressable's own box is grown to MIN_TOUCH_TARGET. Real layout: it
 *                occupies the space, it is what the parent hit-tests, and it works on
 *                iOS, Android and react-native-web identically.
 * - `hitSlop`  — the box stays 24pt and the touch area is extended past it. Costs no
 *                layout, but it is native-only (react-native-web ignores hitSlop) and it
 *                is clipped by the parent's bounds exactly like a child drawn outside
 *                them. See `app/lab/hit-target-clipping.tsx`.
 */
export type TargetStrategy = 'padding' | 'hitSlop';

export type IconButtonProps = {
  /** Accessible name. There is no visible text, so this is the only name the button has. */
  label: string;
  icon: ReactNode;
  onPress: () => void;
  expand?: TargetStrategy;
  disabled?: boolean;
  /** Draws the effective touch target. On for the parity screenshot, off in real UI. */
  debug?: boolean;
  hitSlopOverride?: number;
  /** Forwarded so a caller can report the button's measured box instead of trusting the
   *  arithmetic. Used by the icon-target lab screen to print the real 44/48. */
  onLayout?: ViewProps['onLayout'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function IconButton({
  label,
  icon,
  onPress,
  expand = 'padding',
  disabled = false,
  debug = false,
  hitSlopOverride,
  onLayout,
  style,
  testID,
}: IconButtonProps) {
  const slop = hitSlopOverride ?? ICON_PADDING;
  const usesSlop = expand === 'hitSlop';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onLayout={onLayout}
      onPress={() => {
        if (disabled) return;
        onPress();
      }}
      // A number, not an object: RN expands all four edges by it. The object form exists for
      // asymmetric slop (a row's outermost button wants slop outward, not inward).
      hitSlop={usesSlop ? slop : undefined}
      android_ripple={
        USES_RIPPLE && !disabled
          ? {
              color: 'rgba(10, 126, 164, 0.24)',
              foreground: true,
              // Circular and unbounded by the box, which is the Material idiom for an icon
              // button. `borderless: true` lets it spill past a 24pt box, so on the hitSlop
              // build the ripple hints at a target the box does not have.
              borderless: true,
              radius: MIN_TOUCH_TARGET / 2,
            }
          : null
      }
      style={({ pressed }) => [
        styles.base,
        usesSlop ? styles.tight : styles.padded,
        pressed && !USES_RIPPLE && styles.pressed,
        disabled && styles.blocked,
        style,
      ]}>
      {icon}

      {/* Always an absolutely positioned overlay, never a border on the button itself.
          A `borderWidth: 1` for debugging inflates the Yoga box by 2pt, so the outline
          would falsify the very measurement it exists to prove — the first run of this
          screen reported 46x46 for a 44pt target for exactly that reason.
          `pointerEvents: 'none'` then matters twice: the outline must not steal the press,
          and it must not become a second, larger hit-test candidate that fakes the result.
          Inset 0 for the padding build (its own bounds are the target); negative for the
          hitSlop build, which has to draw outside itself. */}
      {debug ? (
        <View
          style={[
            styles.debugOutline,
            usesSlop
              ? { top: -slop, left: -slop, right: -slop, bottom: -slop }
              : StyleSheet.absoluteFillObject,
          ]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  // 24 + 2 * 12 = 48 on Android, 24 + 2 * 10 = 44 elsewhere. The arithmetic lives in
  // press-tokens.ts so it cannot drift from the constant it is derived from.
  //
  // No borderRadius, deliberately. Native hit-testing is rectangular — a rounded view is
  // still tappable in its corners — but CSS hit-testing on react-native-web honours
  // border-radius, so `borderRadius: 22` would carve the four corners out of the target on
  // web only. The circular *look* of a Material icon button comes from the borderless
  // ripple below, which costs the target nothing.
  padded: { padding: ICON_PADDING },
  tight: { width: ICON_SIZE, height: ICON_SIZE },
  pressed: { opacity: PRESSED_OPACITY },
  blocked: { opacity: BLOCKED_OPACITY },
  debugOutline: {
    position: 'absolute',
    pointerEvents: 'none',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.accent,
  },
});
