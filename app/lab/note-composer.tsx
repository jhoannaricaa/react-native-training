import { Stack } from 'expo-router';

import { NoteComposer } from '@/components/composer/note-composer';

/**
 * FieldKit's note composer. The whole screen is the composer: it owns the
 * KeyboardAvoidingView, so nothing above it can add padding the avoider does not know about.
 */
export default function NoteComposerScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Note composer' }} />
      <NoteComposer />
    </>
  );
}
