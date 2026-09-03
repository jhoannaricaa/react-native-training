import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from 'react-native';

/**
 * Hex palette. Two jobs:
 *  - the actual colours on web and on any platform without a semantic colour API,
 *  - the light/dark pair handed to DynamicColorIOS so all three paths agree.
 */
export const HEX = {
  light: {
    screen: '#FFFFFF',
    bubble: '#EEF1F2',
    text: '#11181C',
    muted: '#687076',
  },
  dark: {
    screen: '#0B0D0E',
    bubble: '#22282B',
    text: '#ECEDEE',
    muted: '#9BA1A6',
  },
} as const;

export type ColorRole = keyof typeof HEX.light;
export type ColorScheme = 'light' | 'dark';

/** Brand colour, deliberately not semantic: an unread dot must not restyle itself per OS. */
export const UNREAD_DOT = '#E5484D';

/** Same brand red, different job: an invalid field border. Named separately so a future
 *  palette change can move one without dragging the other along. */
export const DANGER = '#E5484D';

const dynamic = (role: ColorRole) =>
  DynamicColorIOS({ light: HEX.light[role], dark: HEX.dark[role] });

/**
 * Built once, and only for the platform we are on. A plain object literal would not work:
 * `Platform.select({ ios: DynamicColorIOS(...), android: PlatformColor(...) })` evaluates
 * every branch, and DynamicColorIOS throws on Android. Ternaries stay lazy.
 */
const SEMANTIC: Record<ColorRole, ColorValue> | null =
  Platform.OS === 'ios'
    ? {
        screen: dynamic('screen'),
        bubble: dynamic('bubble'),
        text: dynamic('text'),
        muted: dynamic('muted'),
      }
    : Platform.OS === 'android'
      ? {
          // Resolved against the activity theme, so it needs a DayNight theme to swap.
          screen: PlatformColor('?android:attr/colorBackground'),
          bubble: PlatformColor('?android:attr/colorBackgroundFloating'),
          text: PlatformColor('?android:attr/textColorPrimary'),
          muted: PlatformColor('?android:attr/textColorSecondary'),
        }
      : null;

/**
 * `scheme` is only read on the fallback path. On iOS and Android the returned value is a
 * live OS colour: it re-resolves itself when the system theme flips, without a re-render.
 */
export function adaptiveColor(role: ColorRole, scheme: ColorScheme): ColorValue {
  return SEMANTIC ? SEMANTIC[role] : HEX[scheme][role];
}
