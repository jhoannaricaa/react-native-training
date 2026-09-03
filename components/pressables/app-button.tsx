import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  BLOCKED_OPACITY,
  MIN_TOUCH_TARGET,
  PRESSED_OPACITY,
  USES_RIPPLE,
  VARIANTS,
  type ButtonVariant,
} from '@/components/pressables/press-tokens';
import { THEME } from '@/constants/lab-theme';

export type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Shows a spinner and blocks press. Distinct from `disabled`: it also sets a11y `busy`. */
  loading?: boolean;
  /**
   * Delay before the *pressed visual* appears. `onPress` is unaffected — it still fires on
   * release. 0 for a standalone button; ~90ms for one inside a scrollable, where a 0-delay
   * highlight flashes on every scroll that starts on top of the button.
   */
  pressDelay?: number;
  /**
   * Opt-in, and off by default. This button already clears the target through padding, and
   * slop on a button in a row of buttons overlaps its neighbour's — the last one to hit-test
   * wins, which is not a coin flip you want in a form.
   */
  hitSlop?: PressableProps['hitSlop'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onPressIn?: PressableProps['onPressIn'];
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  pressDelay = 0,
  hitSlop,
  style,
  testID,
  onPressIn,
}: AppButtonProps) {
  const tokens = VARIANTS[variant];

  // One derived flag, read by the visual, the a11y state, the ripple and the press guard.
  // Anything computed twice can disagree for a frame; this cannot.
  const blocked = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      // Stated rather than inherited from the child Text. While `loading`, the label is at
      // opacity 0 — which iOS treats as hidden from the accessibility tree — so without
      // this the button would lose its name at exactly the moment it starts announcing
      // "busy". (`role="button"` is the newer alias; `accessibilityRole` is the prop with
      // the full state vocabulary attached, so both halves stay on the same API.)
      accessibilityLabel={label}
      // `busy` and `disabled` both, on purpose. A control that ignores taps has to announce
      // disabled or VoiceOver invites a tap that does nothing; `busy` alone would say
      // "loading" while still reading as actionable.
      accessibilityState={{ disabled: blocked, busy: loading }}
      // Not redundant. On react-native-web 0.21 `accessibilityState.disabled` does reach
      // `aria-disabled`, but `busy` reaches nothing — verified in the browser, the attribute
      // came back null. So the web build needs the ARIA prop stated alongside the RN one,
      // and both are kept because neither covers all three platforms on its own.
      aria-busy={loading}
      disabled={blocked}
      // Belt and braces. `disabled` already stops Pressability from calling this, but the
      // guard is what makes "onPress never fires when disabled or loading" a property of
      // this component rather than of a prop someone can forget to thread through.
      onPress={() => {
        if (blocked) return;
        onPress();
      }}
      onPressIn={onPressIn}
      hitSlop={hitSlop}
      unstable_pressDelay={pressDelay}
      // Android's idiom. `foreground: true` is load-bearing: the default draws the ripple
      // *behind* the view's content, where an opaque `backgroundColor` hides it completely,
      // so a filled button would look dead on press.
      // Nulled while blocked — the ripple is a native drawable driven by the native touch,
      // not by the JS responder, so a disabled Pressable can still ripple.
      android_ripple={USES_RIPPLE && !blocked ? { color: tokens.ripple, foreground: true } : null}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: tokens.background, borderColor: tokens.border },
        // Fade only where there is no ripple. Doing both on Android reads as a double
        // acknowledgement of one tap.
        pressed && !USES_RIPPLE && styles.pressed,
        blocked && styles.blocked,
        style,
      ]}>
      {/* Kept mounted and merely invisible while loading, so the button does not change
          width the instant it starts working. */}
      <Text style={[styles.label, { color: tokens.label }, loading && styles.hidden]}>{label}</Text>

      {loading ? (
        <View style={[StyleSheet.absoluteFill, styles.center, styles.inert]}>
          <ActivityIndicator
            testID={`${testID ?? 'app-button'}-spinner`}
            size="small"
            color={tokens.label}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // minHeight, not height: 12 + 21 + 12 = 45pt of content, so the floor only shows up on
    // Android (48) — and either way the button still grows when the label wraps at a large
    // font scale instead of clipping it.
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radius,
    // Always 1, transparent on the filled variants: a border that appears only on
    // `secondary` would make that one variant 2pt shorter than the other two.
    borderWidth: 1,
    // Clips the Android ripple to the rounded corners. Without it the ripple is a square
    // wash that overhangs the radius.
    overflow: 'hidden',
  },
  pressed: { opacity: PRESSED_OPACITY },
  blocked: { opacity: BLOCKED_OPACITY },
  center: { alignItems: 'center', justifyContent: 'center' },
  // style.pointerEvents, not the deprecated prop: the overlay must never be a hit-test
  // candidate, or a tap that lands on the spinner misses the button under it.
  inert: { pointerEvents: 'none' },
  label: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  hidden: { opacity: 0 },
});
