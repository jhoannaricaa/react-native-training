import { Platform } from 'react-native';

import { DANGER } from '@/constants/adaptive-colors';
import { THEME } from '@/constants/lab-theme';

/**
 * The two numbers this whole drill is about.
 *
 * Apple's HIG asks for 44pt; Android's accessibility scanner flags anything under 48dp.
 * They are not the same number, so the target is picked per platform rather than
 * splitting the difference — 44 on Android fails the scanner, 48 on iOS is just bigger.
 * Web takes 44: react-native-web has no scanner, and a mouse is not a thumb.
 */
export const MIN_TOUCH_TARGET = Platform.select({ android: 48, default: 44 });

/** Every glyph in this kit is drawn inside a box exactly this big. */
export const ICON_SIZE = 24;

/**
 * Padding that grows a 24pt glyph into a full-size target: 12 on Android, 10 elsewhere.
 * Note this is real layout, not a hint — see `expand="padding"` in `icon-button.tsx`.
 */
export const ICON_PADDING = (MIN_TOUCH_TARGET - ICON_SIZE) / 2;

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type VariantStyle = {
  background: string;
  label: string;
  border: string;
  /** Android only. Must be a plain colour string: `android_ripple` is read by the native
   *  view config, which cannot resolve a DynamicColorIOS/PlatformColor object. */
  ripple: string;
};

/**
 * Deliberately scheme-independent. Two of the three variants are a saturated fill with a
 * white label, which reads in either scheme, and `secondary` is a ghost button whose only
 * colour is the accent — so there is nothing here for `useColorScheme` to flip.
 */
export const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: {
    background: THEME.accent,
    label: '#FFFFFF',
    border: 'transparent',
    ripple: 'rgba(255, 255, 255, 0.28)',
  },
  secondary: {
    background: 'transparent',
    label: THEME.accent,
    border: THEME.accent,
    // Darker ripple: a white ripple on a transparent surface is invisible in light mode.
    ripple: 'rgba(10, 126, 164, 0.20)',
  },
  danger: {
    background: DANGER,
    label: '#FFFFFF',
    border: 'transparent',
    ripple: 'rgba(255, 255, 255, 0.28)',
  },
};

/** iOS/web pressed opacity. Matches the ~0.6 UIKit lands on for a highlighted system button. */
export const PRESSED_OPACITY = 0.6;

/** Disabled opacity, shared by the Pressable and TouchableOpacity builds so they compare. */
export const BLOCKED_OPACITY = 0.45;

/**
 * True where the platform's idiom is a ripple rather than a fade. Checked once at module
 * scope: `Platform.OS` cannot change at runtime, and reading it per render invites someone
 * to make it a hook later.
 */
export const USES_RIPPLE = Platform.OS === 'android';
