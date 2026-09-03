import { Stack } from 'expo-router';

import { PressKit } from '@/components/pressables/press-kit';

/** AppButton: variants, blocked states, measured press latency, and the Touchable rewrite. */
export default function PressKitScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'AppButton' }} />
      <PressKit />
    </>
  );
}
