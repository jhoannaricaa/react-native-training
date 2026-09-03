import { useState } from 'react';

/**
 * Keyed press tally. The counters are the actual assertion in this lab: "onPress never
 * fires when disabled or loading" is only believable if a blocked button is visibly still
 * at 0 after you have hammered it.
 */
export function usePressCounter() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const bump = (key: string) => {
    // Functional update, not `counts[key] + 1`: two taps inside one batch would otherwise
    // both read the same stale count and record as one.
    setCounts((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  };

  return { counts, bump };
}
