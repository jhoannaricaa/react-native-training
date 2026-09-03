import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export type PressLatencyProbeProps = {
  /** Receives the handler to hand to the button's `onPressIn`. */
  render: (onPressIn: () => void) => ReactNode;
  testID?: string;
};

/**
 * Measures press latency instead of quoting it.
 *
 * `onTouchStart` on this wrapper is a raw View touch event: it fires the moment the finger
 * lands, before the responder system has decided anything. `onPressIn` on the child fires
 * after Pressability's press delay. The difference between the two is the button's actual
 * input latency on this device, which is the only number worth reporting.
 *
 * The timestamp lives in a ref, not state: setting state on touch-start would re-render
 * mid-gesture and put the render itself inside the thing being measured.
 */
export function PressLatencyProbe({ render, testID }: PressLatencyProbeProps) {
  const touchStart = useRef<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  return (
    <View
      style={styles.row}
      onTouchStart={() => {
        touchStart.current = Date.now();
      }}>
      {render(() => {
        if (touchStart.current === null) return;
        setLatency(Date.now() - touchStart.current);
      })}
      <ThemedText testID={testID} variant="meta" tone="muted" style={styles.readout}>
        {latency === null ? 'tap to measure' : `feedback +${latency}ms`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', columnGap: 12 },
  readout: { flexShrink: 1 },
});
