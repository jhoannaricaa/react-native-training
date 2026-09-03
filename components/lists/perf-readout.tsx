import { StyleSheet, View } from 'react-native';

import { useFrameMeter, useMountTiming } from '@/components/lists/use-perf-clock';
import { AppButton } from '@/components/pressables/app-button';
import { ThemedText } from '@/components/themed-text';

export type PerfReadoutProps = {
  /** Captured in the screen's render body, before the list renders. */
  startedAt: number;
  label: string;
};

/**
 * The numbers, on screen. A sibling of the list rather than its parent: every state update
 * in here (a published frame tally, four times a second) re-renders this readout only, so
 * the meter never becomes the jank it is reporting.
 */
export function PerfReadout({ startedAt, label }: PerfReadoutProps) {
  const timing = useMountTiming(startedAt);
  const { stats, reset } = useFrameMeter();

  const fps = stats.elapsedMs > 0 ? (stats.frames / stats.elapsedMs) * 1000 : 0;

  return (
    <View style={styles.panel}>
      <ThemedText variant="title">{label}</ThemedText>
      <ThemedText testID="mount-timing" variant="meta" tone="muted">
        {timing === null
          ? 'mounting…'
          : `mount: commit ${timing.commitMs.toFixed(0)}ms · first frame ${timing.frameMs.toFixed(0)}ms`}
      </ThemedText>
      <ThemedText testID="frame-stats" variant="meta" tone="muted">
        {`frames ${stats.frames} in ${(stats.elapsedMs / 1000).toFixed(1)}s (${fps.toFixed(0)}fps) · >32ms ${stats.janky} · >64ms ${stats.severe} · worst ${stats.worstMs.toFixed(0)}ms`}
      </ThemedText>
      <AppButton testID="reset-frames" label="Reset frame meter" variant="secondary" onPress={reset} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 12, rowGap: 6 },
});
