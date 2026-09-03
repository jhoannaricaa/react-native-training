import { useEffect, useRef, useState } from 'react';

/** `performance.now()` where it exists (web, Hermes), millisecond `Date.now()` otherwise. */
export const now = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

export type MountTiming = { commitMs: number; frameMs: number };

/**
 * Mount cost, measured from a timestamp the *screen* took in its own render body and
 * handed down — so the clock covers the whole subtree, not just this readout.
 *
 * - `commitMs` — render + commit of every child. The effect of a component that renders
 *   after the list cannot run until the list has rendered and committed.
 * - `frameMs`  — the same, plus the first frame after it. On web that is layout and paint;
 *   the gap between the two is the cost the browser pays for the DOM the commit produced.
 */
export function useMountTiming(startedAt: number): MountTiming | null {
  const [timing, setTiming] = useState<MountTiming | null>(null);

  useEffect(() => {
    const commitMs = now() - startedAt;
    const frame = requestAnimationFrame(() => {
      setTiming({ commitMs, frameMs: now() - startedAt });
    });
    return () => cancelAnimationFrame(frame);
    // Measured once per mount. `startedAt` is a value captured at first render.
  }, [startedAt]);

  return timing;
}

export type FrameStats = {
  frames: number;
  /** Frames longer than 32ms: at 60Hz, at least one frame was missed. */
  janky: number;
  /** Frames longer than 64ms: three or more missed, visible as a stutter. */
  severe: number;
  worstMs: number;
  elapsedMs: number;
};

const EMPTY: FrameStats = { frames: 0, janky: 0, severe: 0, worstMs: 0, elapsedMs: 0 };

/** One frame at 60Hz, doubled. Anything past it dropped a frame. */
const JANK_MS = 32;
const SEVERE_MS = 64;

/** How often the tally is published to state. Publishing per frame would render 60x/s. */
const PUBLISH_MS = 400;

/**
 * Counts long frames on the JS thread.
 *
 * `requestAnimationFrame` in React Native is scheduled by the JS thread, so a gap between
 * two callbacks is JS-thread time the UI could not have used. On web the two threads are
 * the same thread, which makes the number directly comparable to a dropped frame.
 *
 * Every sample lands in a ref. Counting frames with `setState` would put a re-render
 * inside the thing being measured.
 */
export function useFrameMeter(): { stats: FrameStats; reset: () => void } {
  const [stats, setStats] = useState<FrameStats>(EMPTY);
  const tally = useRef<FrameStats>(EMPTY);
  const resetAt = useRef(0);

  useEffect(() => {
    let frame = 0;
    let first = true;
    let last = now();
    let published = last;
    resetAt.current = last;

    const tick = () => {
      const t = now();
      const delta = t - last;
      last = t;

      // The gap between the effect running and the first callback is the mount's own
      // paint. That belongs to `useMountTiming`, not to the scroll tally below.
      if (first) {
        first = false;
        frame = requestAnimationFrame(tick);
        return;
      }

      const current = tally.current;
      tally.current = {
        frames: current.frames + 1,
        janky: current.janky + (delta > JANK_MS ? 1 : 0),
        severe: current.severe + (delta > SEVERE_MS ? 1 : 0),
        worstMs: Math.max(current.worstMs, delta),
        elapsedMs: t - resetAt.current,
      };

      if (t - published >= PUBLISH_MS) {
        published = t;
        setStats(tally.current);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return {
    stats,
    reset: () => {
      tally.current = EMPTY;
      resetAt.current = now();
      setStats(EMPTY);
    },
  };
}
