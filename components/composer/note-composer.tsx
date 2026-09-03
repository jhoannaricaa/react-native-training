import { useHeaderHeight } from '@react-navigation/elements';
import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComposerField } from '@/components/composer/composer-field';
import { TitleCounter } from '@/components/composer/title-counter';
import { useKeyboardVisible } from '@/components/composer/use-keyboard-visible';
import { TITLE_MAX_LENGTH, useNoteDraft, type SavedNote } from '@/components/composer/use-note-draft';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor, DANGER } from '@/constants/adaptive-colors';
import { THEME } from '@/constants/lab-theme';

const TITLE_MESSAGE: Record<'empty' | 'too-long', string> = {
  empty: 'A title is required.',
  'too-long': `Titles stop at ${TITLE_MAX_LENGTH} characters.`,
};

export function NoteComposer() {
  const scheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  // KeyboardAvoidingView measures its own frame relative to its *parent*, which under a
  // Stack screen already starts below the header. Without this offset it thinks it sits
  // `headerHeight` higher than it does and under-pads by exactly that much.
  const headerHeight = useHeaderHeight();
  const keyboardVisible = useKeyboardVisible();

  const bodyRef = useRef<TextInput>(null);
  const { draft, setField, titleError, canSave, remaining, tags, commit } = useNoteDraft();
  const [lastSaved, setLastSaved] = useState<SavedNote | null>(null);

  const handleSave = () => {
    const note = commit();
    if (note === null) return;
    Keyboard.dismiss();
    setLastSaved(note);
  };

  return (
    <KeyboardAvoidingView
      // `padding` on both platforms, not the usual `padding`/`height` split. `height`
      // only pays off when the Android window itself shrinks under the keyboard, and
      // under the edge-to-edge layout RN 0.81 targets it does not — the IME arrives as
      // an inset, not a resize. Both behaviours double-count if the window *does*
      // resize, so this is the assumption to re-check first on a real Android device.
      // See docs/keyboard-forms/FINDINGS.md → Limits.
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={[styles.flex, { backgroundColor: adaptiveColor('screen', scheme) }]}>
      <ScrollView
        contentContainerStyle={styles.page}
        // The single most load-bearing prop here. The default, `never`, spends the first
        // tap dismissing the keyboard and never delivers it — so tapping straight from the
        // title into the tag field would take two taps. `handled` delivers taps that a
        // child claims, and still dismisses the ones that land on empty space.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <ComposerField
          testID="composer-title"
          label="Title"
          placeholder="Ported the chat row"
          value={draft.title}
          onChangeText={(text) => setField('title', text)}
          invalid={titleError !== null}
          // Deliberately no `maxLength`: the over-limit state has to be reachable, or the
          // validation this drill is about could never fire.
          returnKeyType="next"
          // RN 0.79 replaced `blurOnSubmit`. `submit` fires onSubmitEditing *without*
          // blurring, so focus hops to the body with no keyboard teardown in between.
          submitBehavior="submit"
          onSubmitEditing={() => bodyRef.current?.focus()}
          hint={<TitleCounter length={draft.title.length} remaining={remaining} />}
        />
        {titleError !== null ? (
          <Text testID="title-error" style={styles.errorText}>
            {TITLE_MESSAGE[titleError]}
          </Text>
        ) : null}

        <ComposerField
          ref={bodyRef}
          testID="composer-body"
          label="Body"
          placeholder="What happened, and what it cost"
          value={draft.body}
          onChangeText={(text) => setField('body', text)}
          multiline
          // The default for a multiline input already, but stated: this is the one field
          // whose Return must type a newline instead of moving focus on.
          submitBehavior="newline"
        />

        <ComposerField
          testID="composer-tags"
          label="Tags"
          placeholder="rn, layout, keyboard"
          value={draft.tags}
          onChangeText={(text) => setField('tags', text)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag.toLowerCase()} style={styles.tagChip}>
                <ThemedText variant="meta">#{tag}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {lastSaved !== null ? (
          <View testID="last-saved" style={styles.saved}>
            <ThemedText variant="meta" tone="muted">
              Saved · {lastSaved.tags.length} tag{lastSaved.tags.length === 1 ? '' : 's'}
            </ThemedText>
            <ThemedText variant="title">{lastSaved.title}</ThemedText>
          </View>
        ) : null}
      </ScrollView>

      {/* Outside the ScrollView on purpose. Inside it, the button would scroll away under
          the keyboard on a short screen; here KeyboardAvoidingView lifts it as a unit. */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: adaptiveColor('screen', scheme),
            borderTopColor: adaptiveColor('bubble', scheme),
            paddingBottom: keyboardVisible ? 12 : insets.bottom + 12,
          },
        ]}>
        <Pressable
          testID="save-note"
          role="button"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: !canSave ? 0.4 : pressed ? 0.75 : 1 },
          ]}>
          <Text style={styles.saveLabel}>Save note</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // flexGrow so the content fills a short form, which keeps the empty area below the
  // fields part of the ScrollView — that is the "tap outside" target.
  page: { flexGrow: 1, padding: 16, rowGap: 16 },

  errorText: { fontSize: 12, lineHeight: 16, marginTop: -10, color: DANGER },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 8 },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: THEME.accent,
  },

  saved: { marginTop: 8, rowGap: 2 },

  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  saveButton: {
    backgroundColor: THEME.accent,
    borderRadius: THEME.radius,
    // 48dp of touch target, the Android accessibility floor. Measured at 375 x 667:
    // 15 + 18 (line box) + 15 = 48. Padding rather than a fixed height so the button
    // still grows if the label wraps at a large font scale.
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
