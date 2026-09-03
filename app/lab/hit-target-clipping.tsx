import { Stack } from 'expo-router';

import { ClippingDemo } from '@/components/pressables/clipping-demo';

/** Reproduction: a touch target outside its parent's bounds is untappable on native. */
export default function HitTargetClippingScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Bounds clipping' }} />
      <ClippingDemo />
    </>
  );
}
