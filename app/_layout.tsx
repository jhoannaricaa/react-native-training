import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Kept deliberately: a non-component export makes the root layout a non-boundary,
// so every edit to this file triggers a full reload. See docs/fast-refresh/FINDINGS.md.
export const unstable_settings = {
  anchor: 'lab',
};

export default function RootLayout() {
  return (
    <>
      <Stack />
      <StatusBar style="auto" />
    </>
  );
}
