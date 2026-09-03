import { Stack } from 'expo-router';

import { IconTargetDemo } from '@/components/pressables/icon-target-demo';

/** A 24pt glyph reaching a 44/48 target, three ways, with the target drawn. */
export default function IconTargetScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Icon target' }} />
      <IconTargetDemo />
    </>
  );
}
