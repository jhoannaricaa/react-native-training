import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  BLOCKED_OPACITY,
  MIN_TOUCH_TARGET,
  PRESSED_OPACITY,
  VARIANTS,
  type ButtonVariant,
} from '@/components/pressables/press-tokens';
import { THEME } from '@/constants/lab-theme';

/**
 * The same button on TouchableOpacity, kept alongside the Pressable build so the gap is
 * readable rather than asserted. See docs/pressables/FINDINGS.md -> "What TouchableOpacity
 * cannot do" for the full account; the three losses visible in this file are:
 *
 *  1. No `android_ripple`. There is no ripple prop on any Touchable except
 *     TouchableNativeFeedback, which is Android-only, has no iOS fallback, and requires a
 *     single native child. So this button fades on Android — non-idiomatic, and identical
 *     on both platforms, which is exactly what the drill asked us not to ship.
 *  2. `style` is a plain style, never a function of the press state. There is no `pressed`
 *     to read, so a pressed *background*, border or elevation is unreachable; the only
 *     pressed channel is `activeOpacity`.
 *  3. That opacity applies to the whole subtree. "Background darkens, label stays solid"
 *     cannot be expressed, because the label is inside the thing being faded.
 */
export type TouchableAppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function TouchableAppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}: TouchableAppButtonProps) {
  const tokens = VARIANTS[variant];
  const blocked = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      // Everything on the accessibility side ports across unchanged — the a11y props live
      // on View, not on Pressable, so this is not where the difference is.
      accessibilityState={{ disabled: blocked, busy: loading }}
      // Not redundant. On react-native-web 0.21 `accessibilityState.disabled` does reach
      // `aria-disabled`, but `busy` reaches nothing — verified in the browser, the attribute
      // came back null. So the web build needs the ARIA prop stated alongside the RN one,
      // and both are kept because neither covers all three platforms on its own.
      aria-busy={loading}
      disabled={blocked}
      onPress={() => {
        if (blocked) return;
        onPress();
      }}
      // The one pressed-state knob available. Note there is no way to make this depend on
      // the variant's contrast: a ghost button and a filled button get the same fade.
      activeOpacity={PRESSED_OPACITY}
      style={[
        styles.button,
        { backgroundColor: tokens.background, borderColor: tokens.border },
        blocked && styles.blocked,
        style,
      ]}>
      <Text style={[styles.label, { color: tokens.label }, loading && styles.hidden]}>{label}</Text>
      {loading ? (
        <View style={[StyleSheet.absoluteFill, styles.center, styles.inert]}>
          <ActivityIndicator size="small" color={tokens.label} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  blocked: { opacity: BLOCKED_OPACITY },
  center: { alignItems: 'center', justifyContent: 'center' },
  inert: { pointerEvents: 'none' },
  label: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  hidden: { opacity: 0 },
});
