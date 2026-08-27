# Fast Refresh boundaries

One counter screen, three export shapes. Export shape is the only variable.

Expo SDK 54.0.36 / RN 0.81.5 / React 19.1. Measured on Metro web HMR, driven by Playwright.
Every number below was observed.

Full-reload detector: set `window.__labSentinel = 'alive'` before each save. A hot swap keeps it,
`location.reload()` wipes it. Cross-checked against the DOM `load` event.

## The three rules

From the React Native docs:

1. A module exporting **only components** updates in place and re-renders.
2. A module exporting **non-components** re-runs, along with its importers.
3. A module imported from **outside the React tree** forces a full reload.

## Results

| # | File | Export shape | count | Reload | Rule |
|---|---|---|---|---|---|
| 1 | [`counter-only-component.tsx`](../../app/lab/counter-only-component.tsx) | component only | 5 → 5 | no | 1 |
| 2 | [`counter-with-theme.tsx`](../../app/lab/counter-with-theme.tsx) | component + `THEME` | 7 → 0 | no | 2 |
| 3 | [`counter-theme-via-util.tsx`](../../app/lab/counter-theme-via-util.tsx) | `THEME` read by a non-React util | 9 → 0 | **yes** | 3 |
| 3′ | same file, after refactor | component only | 9 → 9 | no | 1 |
| 4 | [`constants/lab-theme.ts`](../../constants/lab-theme.ts) | the extracted constant | 9 → 9 | no | 2 |

Three outcomes, not two. Rules 2 and 3 both lose state; only Rule 3 restarts the app.

**Case 1.** Only export is a component, so the module is a refresh boundary. Update applies in
place, hook state survives.

**Case 2.** `THEME` is not component-like, so no boundary. The edit re-runs the module and its
importer — expo-router's route machinery — which recreates the component, so `useState` resets.
Propagation stops below the root: a module-scope log in `app/_layout.tsx` never fired. In practice:
state resets, no flash.

**Case 3.** [`counter-label-util.ts`](../../components/lab/counter-label-util.ts) has no React in
it and imported `THEME` from the screen. The edit propagated into it, found no boundary above, hit
the root, and Metro fell back to `location.reload()`. Console showed every lab module re-evaluating
plus a require-cycle warning. In practice: the whole app flashes.

**Case 4.** Editing the extracted constant is still Rule 2, but propagation runs
constant → util → screen, and the screen is a boundary, so it stops there.

So the question is not whether the edited file is a boundary, but whether propagation reaches a
boundary before it reaches the root.

## The case 3 refactor

Before — the screen owns the constant, and a plain module reaches back into the screen to read it:

```ts
// app/lab/counter-theme-via-util.tsx
export const THEME = { accent: '#0a7ea4', radius: 8 };   // non-component export
export default function CounterThemeViaUtil() { /* ... */ }

// components/lab/counter-label-util.ts
import { THEME } from '@/app/lab/counter-theme-via-util'; // plain module → screen file
```

That import pair is the problem: it creates the cycle `screen → util → screen` and puts a non-React
module downstream of the screen, so the screen can never be a boundary.

After — the constant belongs to neither, so both import it downward:

```ts
// constants/lab-theme.ts                                 ← new file
export const THEME = { accent: '#0a7ea4', radius: 8 };

// app/lab/counter-theme-via-util.tsx
import { THEME } from '@/constants/lab-theme';
export default function CounterThemeViaUtil() { /* ... */ }   // only export

// components/lab/counter-label-util.ts
import { THEME } from '@/constants/lab-theme';
```

| | Before | After |
|---|---|---|
| Counter across the save | 9 → 0 | 9 → 9 |
| `window.__labSentinel` | gone | alive |
| Document reloaded | yes | no |
| Modules re-evaluated | all lab modules | `case-3` only |
| Require cycle warning | yes | none |

Both runs were recorded live, edited at the same 1203 ms mark, and played back side by side as a
frame sequence (`case-3-refactor-recording.html`, not committed — 677 KB of embedded frames).
Frames rather than video: no `ffmpeg` on this host, and Playwright has dropped ffmpeg support for
macOS 13.

The file in the tree holds the fixed shape. The broken shape is preserved above rather than left in
the app, because a permanent require cycle warns on every startup.

## `useEffect(..., [])` re-runs

Each file saved three times in a row, counting `mounted` log lines per save.

| Export shape | Rule | count per save | `mounted` per save |
|---|---|---|---|
| component only | 1 | 5, 5, 5 | 1, 1, 1 |
| component + `THEME` | 2 | 0, 0, 0 | 1, 1, 1 |
| constant read by non-React util | 3 | 0, 0, 0 | 1, 1, 1 |
| case 3 refactored | 1 | 9, 9, 9 | 1, 1, 1 |

Twelve saves, twelve fires, empty dependency array throughout — including the six saves where the
component was never remounted at all. The refactor moved the count from 0 to 9 and moved the effect
count not at all. State preservation and effect re-runs are independent.

Matches the docs: dependency lists "will be ignored while Fast Refresh is happening… Even a
`useEffect` with an empty array of dependencies would still re-run once."

Consequence: `[]` does not mean "once per app run" in dev. Analytics events, `POST`s, socket opens,
and one-shot migrations in a mount effect fire again on every save. Dev-only double counts are
usually this, not a StrictMode double-invoke.

## Takeaways

1. Screen and component files export components and nothing else. Constants, helpers, and
   types-with-values get their own module.
2. A non-React module importing from a screen file is the expensive smell. Invert it — both should
   import from a third module.
3. `export const unstable_settings` in `app/_layout.tsx` makes the root layout a non-boundary,
   so every layout edit full-reloads regardless.
4. Never rely on `[]` firing once in dev. Make mount effects idempotent.
5. Diagnosing by feel: state resets with no flash → Rule 2. Whole app flashes → Rule 3.

## Reproducing

`npx expo start --web`, then open `/lab`. Bump the counter, edit the screen's `marker:` string,
save, and watch the counter and the console — that alone separates the three rules.

The Playwright probes that produced the numbers above were not kept, so the automated runs are not
reproducible as written; the measurements are, by hand. Rebuilding them means driving a save while
polling `window.__labSentinel` (see the detector above), and Playwright is not a dependency of this
project.

## Unresolved

- Which expo-router module accepts the Rule 2 update — only bounded to above the route file, below
  `app/_layout.tsx`.
- Web/Metro HMR only. The same react-refresh boundary logic runs on native, but a Rule 3 reload
  there is a JS bundle reload rather than `location.reload()`. Not verified on a simulator.
- react-compiler was on throughout. No apparent effect on boundary behavior; not tested off.
