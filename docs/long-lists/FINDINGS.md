# Five thousand rows

The same 5,000 `{ id, name }` objects rendered twice — once as `ScrollView` children, once as
`FlatList` data — measured, then converted into a list that is actually shippable.
Expo SDK 54.0.36 / RN 0.81.5 / react-native-web 0.21, New Architecture on, React Compiler on.

| Screen | Component |
|---|---|
| [`app/lab/rows-scrollview.tsx`](../../app/lab/rows-scrollview.tsx) | [`scroll-view-rows.tsx`](../../components/lists/scroll-view-rows.tsx) |
| [`app/lab/rows-flatlist.tsx`](../../app/lab/rows-flatlist.tsx) | [`flat-list-rows.tsx`](../../components/lists/flat-list-rows.tsx) |
| [`app/lab/contacts.tsx`](../../app/lab/contacts.tsx) | [`contact-list.tsx`](../../components/lists/contact-list.tsx) |

Both benchmark screens import the same array from
[`row-items.ts`](../../components/lists/row-items.ts) and the same
[`ListRow`](../../components/lists/list-row.tsx). The array is built at module scope, so
generating 5,000 objects is paid at import time and sits outside every number below.

## How the numbers were taken

The clock lives in the app, not in the harness.
[`use-perf-clock.ts`](../../components/lists/use-perf-clock.ts) exposes two things, both
printed on screen by [`perf-readout.tsx`](../../components/lists/perf-readout.tsx):

- **mount** — the screen takes a timestamp in its own render body and hands it to the
  readout, which is a *sibling* of the list. React flushes passive effects only after the
  whole tree has committed, so the readout's effect cannot run until all 5,000 rows have
  rendered and committed. `commit` is that gap; `first frame` adds the `requestAnimationFrame`
  after it, which is where layout and paint land.
- **frames** — a `requestAnimationFrame` loop counting gaps between callbacks. A gap over
  32ms means at least one frame was missed at 60Hz; over 64ms means three or more. Samples
  accumulate in a ref and publish to state four times a second, so the meter is not the jank
  it reports.

A throwaway Playwright script drove the running web build in system Chrome at a 412×915
viewport, with Chrome DevTools' `Emulation.setCPUThrottlingRate` standing in for a low-end
device. Four loads per configuration, the first discarded as warm-up, medians reported. The
scroll is 40 wheel ticks of 600px — 24,000px, about 428 rows — one every 50ms. Everything it
reads is text the app already puts on screen, so the same measurements can be taken by
finger. **Read [Limits](#limits) before carrying any of this to iOS or Android.**

## Mount

| | ScrollView | FlatList | Ratio |
|---|---:|---:|---:|
| commit, unthrottled | **2,200ms** | **41ms** | 54x |
| first frame, unthrottled | 3,405ms | 59ms | 58x |
| commit, CPU ÷6 | **15,811ms** | **260ms** | 61x |
| first frame, CPU ÷6 | 24,899ms | 361ms | 69x |
| navigation → readout, CPU ÷6 | 34,516ms | 2,873ms | 12x |
| rows in the DOM at the mount reading | 5,000 | 30 | 167x |
| rows in the DOM ~1s later, window settled | 5,000 | 130 | 38x |
| DOM nodes inside the scroller | 30,001 | 212 | 142x |
| JS heap after mount | 129.6 MB | 17.8 MB | 7.3x |

Spread across the three kept runs was tight: ScrollView commit 15,435–16,123ms throttled,
FlatList 242–303ms. The 30,001 nodes are 5,000 rows × 6 nodes plus the content container —
`ListRow` is four views and two text nodes, which is a modest row by production standards.

Throttled, a `ScrollView` of 5,000 rows spends **25 seconds** between navigation and a first
painted frame. That is not slow; that is an ANR on Android and an app the user closes.

## Scroll — 24,000px, same distance on both

| | ScrollView | FlatList |
|---|---:|---:|
| effective fps, unthrottled | 42 | 58 |
| frames >32ms, unthrottled | 45 | 24 |
| frames >64ms, unthrottled | 1 | 1 |
| worst frame, unthrottled | 75ms | 81ms |
| effective fps, CPU ÷6 | **8** | **14** |
| frames >32ms, CPU ÷6 | 82 | 69 |
| frames >64ms, CPU ÷6 | **80** | **41** |
| worst frame, CPU ÷6 | 573ms (356–807) | 406ms (263–607) |
| wall time for the scroll, CPU ÷6 | 11.3s | 12.9s |

Scroll is where the gap narrows, and the honest reading is that neither is good at ÷6.
FlatList halves the severe frames (41 vs 80) but does not eliminate them: its worst frames
are the batches where it renders the next window of cells, and those spikes are absent from
ScrollView, whose work at scroll time is style and layout recalculation over 30,001 nodes it
mounted earlier. FlatList also took *longer* in wall time for the same distance — it is doing
JS work per screenful that ScrollView already did once, up front.

## Jumping to the end — the number that decided the converted list

Set the scroll container to its own `scrollHeight`, then wait for `row-4999` to exist:

| | reported content height | true height | jumps needed | time to reach the last row |
|---|---:|---:|---:|---|
| ScrollView | 280,000px | 280,000px | 1 | 15ms / 146ms at ÷6 |
| FlatList, defaults | **25,760px** | 280,000px | 74 in 30s | **never arrived** |
| FlatList + `getItemLayout` | 284,999px | 284,999px | 2 | 442ms / 894ms at ÷6 |

A `VirtualizedList` with no `getItemLayout` knows only the heights it has measured, so its
content height is an estimate that grows as you scroll into it — the container claimed 25,760px
for a list that is really 280,000px. Every jump lands on a bottom that then moves; after 74
jumps in 30 seconds the last row still did not exist. With `getItemLayout` the height is exact
before anything renders (284,999 = 5,000 × (56 + 1) − 1, the separators included), and two
jumps get there. The scrollbar thumb, `scrollToIndex` and `scrollToEnd` are all downstream of
the same number.

## Why they differ: what each does with an off-screen child

`ScrollView` has no concept of an off-screen child. Its API is `children`, so by the time it is
called, `ROWS.map(...)` has already created 5,000 elements; React reconciles all 5,000, commits
5,000 host views and lays every one of them out. Row 4,999 — 279,944px below the fold — costs
exactly what row 0 costs. Scrolling is then cheap in principle, because the work is done: the
platform's scroll container clips *painting*, but the views exist, occupy memory, and stay in
the layout tree. `removeClippedSubviews` does not change this. It detaches views that are
already mounted; it is a paint optimisation applied after the mount cost has been paid, and it
has a long history of blanking rows on Android. Nothing in ScrollView is willing to *not build*
a child.

`FlatList` (`VirtualizedList` underneath) does not take children. It takes `data` and a
`renderItem` function, which is the whole difference: it decides which indices to call it for.
At mount that is `initialNumToRender` (10 by default) — 30 rows in the DOM at the instant
the mount clock stops, 130 once the list has idled for a second and filled `windowSize`
around the viewport, against 5,000 either way. Off-screen rows are not mounted-and-hidden, they
are *uncreated*: the space they occupy is two spacer views, one above and one below the
rendered window, whose heights come from `getItemLayout` if you supply it and from the average
of already-measured cells if you do not. As the viewport moves, cells entering the window are
rendered and cells leaving it are unmounted, so the mounted set stays roughly constant — which
is why the heap sits at 17.8 MB instead of 129.6 MB, and why mount is O(screenful) instead of
O(n).

That is the trade, and both halves of it are in the tables: FlatList moves work out of mount
and into scroll. ScrollView pays 15.8 seconds once and then owns every row; FlatList pays 260ms
and then pays again, in smaller instalments, every time the window shifts — visible as its
41 severe frames during the fling and, if you scroll faster than it can render, as blank cells.
The estimated content height is the same trade in another form: not having measured the rows,
it cannot tell you how tall the list is.

## The converted list

[`contact-list.tsx`](../../components/lists/contact-list.tsx) — `{ id, name }` objects, explicit
`keyExtractor`, `ItemSeparatorComponent`, `RefreshControl`, and `getItemLayout` earned by the
table above.

![The converted contact list](./contact-list.png)

| Decision | Why |
|---|---|
| `keyExtractor={(item) => item.id}` | RN's default *would* work here — it checks `item.key`, then `item.id`, then `String(index)`. Verified by deleting the prop and watching for the "missing keys for items" warning, which never fired. It stays because the fallback is silent: rename the field to `userId` and every row is keyed by position. This list prepends on refresh, which is exactly when position-keyed rows hand the wrong identity to the wrong row. |
| `renderItem` and `keyExtractor` at module scope | A new function identity each render defeats the memoisation `VirtualizedList` does on its cells. Neither closes over anything, so neither needs to be a hook. |
| `ItemSeparatorComponent` | Rendered *between* rows, never after the last — which a per-row bottom border cannot do without a trailing hairline under row 5,000. |
| `getItemLayout` counts the separator | `(ROW_HEIGHT + SEPARATOR_HEIGHT) * index`. RN's documented formula (`length * index`) is wrong the moment the list has separators, and the error compounds: at a 1px hairline, `scrollToIndex(4999)` lands 4,999px — 88 rows — short. The measured content height, 284,999px, is the arithmetic agreeing with the layout. |
| `RefreshControl`, not a header button | On iOS and Android it is the gesture users already try. `tintColor` colours the iOS spinner, `colors` the Android one; passing one leaves the other platform grey. |
| `refreshing` reset in `finally` | A rejected fetch that skips the reset strands the spinner on screen with no way back. |
| `if (refreshing) return` at the top of the handler | Android will deliver a second pull while the first is in flight. |
| A `Refresh` button on web only | react-native-web renders no pull gesture, so on web the handler is unreachable — the same handler, not a second code path. A refresh a mouse cannot reach is a refresh half the users cannot reach. |
| `nextOffset` in a ref | Ids must not be derived from `rows.length`; one deletion and the next refresh reissues an id that is already on screen. |

Verified against the running app at both throttle settings: `5000 rows` → `5003 rows`, the new
row (`row-5000`, "Imani Moreau 5001") at the top, refresh completing in 1,047ms unthrottled and
1,517ms at ÷6 against a 900ms simulated fetch.

## Limits

**These are react-native-web numbers.** No Android device or emulator was attached to this
machine, so "low-end Android" here means Chrome with its CPU throttled 6x — a proxy for a slow
CPU and nothing else. What that proxy does not model:

- **Memory.** Web pays for 5,000 rows in DOM nodes and JS heap. iOS and Android pay in native
  view objects and a shadow tree. On a 2GB Android device the ScrollView case is likelier to be
  killed outright than to be slow, and this bench cannot show that.
- **Threads.** On web, JS and UI are one thread, so the frame meter sees both. On native they
  are separate: a ScrollView that survives mounting can scroll on the UI thread while JS is
  busy, which flatters ScrollView relative to what is measured here, and FlatList's blank
  cells are a JS-thread symptom that shows up more sharply.
- **Fling physics.** Wheel ticks are not a fling. The blank-cell behaviour that makes FlatList
  feel worse than its frame counts suggest needs a real finger on real momentum scrolling.

The mount ratio is the finding that travels: ~55–60x more work at mount, ~7x the memory, for
rows nobody has scrolled to yet. Everything about scrolling should be re-measured on device.

The only console output on any of these three screens is
`props.pointerEvents is deprecated` and a 404 for a missing favicon — both present on the
untouched lab index too, both from the router/react-native-web layer, neither from this drill.
