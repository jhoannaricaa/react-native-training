import { StyleSheet, Text, useColorScheme, type TextProps } from 'react-native';

import { adaptiveColor, type ColorRole } from '@/constants/adaptive-colors';

type Variant = 'body' | 'meta' | 'title';

export type ThemedTextProps = TextProps & {
  /** Named `tone`, not `role`: RN's TextProps already owns `role` for accessibility, and the
   *  intersection of the two unions is `never`. */
  tone?: ColorRole;
  variant?: Variant;
};

export function ThemedText({ tone = 'text', variant = 'body', style, ...rest }: ThemedTextProps) {
  // Called unconditionally, but consumed only by the hex fallback path (web / unknown
  // platform). On iOS and Android the colour object handles the theme flip itself.
  const scheme = useColorScheme() ?? 'light';

  return <Text {...rest} style={[styles[variant], { color: adaptiveColor(tone, scheme) }, style]} />;
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 21 },
  meta: { fontSize: 12, lineHeight: 16 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
});
