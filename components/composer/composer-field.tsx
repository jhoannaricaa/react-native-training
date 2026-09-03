import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { adaptiveColor, DANGER } from '@/constants/adaptive-colors';

export type ComposerFieldProps = TextInputProps & {
  label: string;
  /** Drives the red border. Kept as a prop, not derived here, so validation stays in one place. */
  invalid?: boolean;
  /** Right-hand slot on the label row. The live character counter goes here. */
  hint?: ReactNode;
};

/**
 * A labelled, controlled TextInput.
 *
 * `forwardRef` is the point of the component: the screen needs a handle on the body input
 * to move focus into it when Return is pressed on the title.
 */
export const ComposerField = forwardRef<TextInput, ComposerFieldProps>(function ComposerField(
  { label, invalid = false, hint, multiline = false, style, ...rest },
  ref,
) {
  const scheme = useColorScheme() ?? 'light';

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <ThemedText variant="meta" tone="muted">
          {label}
        </ThemedText>
        {hint}
      </View>

      <TextInput
        ref={ref}
        multiline={multiline}
        // RN does not wire a sibling <Text> to an input the way a web <label for> does,
        // so the accessible name has to be stated. Placed before the spread: a caller
        // passing its own accessibilityLabel still wins.
        accessibilityLabel={label}
        placeholderTextColor={adaptiveColor('muted', scheme)}
        style={[
          styles.input,
          {
            backgroundColor: adaptiveColor('bubble', scheme),
            color: adaptiveColor('text', scheme),
            // Transparent rather than absent: the border is always laid out, so turning it
            // red cannot reflow the field and shove the rest of the form down a pixel.
            borderColor: invalid ? DANGER : 'transparent',
          },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  field: { rowGap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    // Android draws its own vertical padding inside a TextInput and iOS does not, so the
    // two are set apart rather than folded into one `padding`.
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 21,
  },
  multiline: {
    minHeight: 132,
    // Android centres multiline text vertically by default; iOS already starts at the top.
    textAlignVertical: 'top',
  },
});
