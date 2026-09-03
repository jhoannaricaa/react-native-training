# Buttons you can actually hit

PressKit: `AppButton`, a 24pt icon button, and a reproduction of the bug that makes touch
targets lie. Expo SDK 54.0.36 / RN 0.81.5 / react-native-web 0.21, React Compiler on.

| Screen | Component |
|---|---|
| [`app/lab/press-kit.tsx`](../../app/lab/press-kit.tsx) | [`press-kit.tsx`](../../components/pressables/press-kit.tsx) → [`app-button.tsx`](../../components/pressables/app-button.tsx) |
| [`app/lab/icon-target.tsx`](../../app/lab/icon-target.tsx) | [`icon-target-demo.tsx`](../../components/pressables/icon-target-demo.tsx) → [`icon-button.tsx`](../../components/pressables/icon-button.tsx) |
| [`app/lab/hit-target-clipping.tsx`](../../app/lab/hit-target-clipping.tsx) | [`clipping-demo.tsx`](../../components/pressables/clipping-demo.tsx) |

Every number below was measured against the running web build (`npx expo start --web`),
driven by a throwaway Playwright script: for each control it reads the real
`boundingBox()`, clicks points computed from it — corners, edge midpoints, a few pixels
outside — and reads the on-screen tap counters back. Nothing about that method needs
tooling to repeat: the counters are part of the app, so the same checks can be done by
finger on a device. Read the caveat in **Limits** before trusting any of these numbers for
iOS or Android.

## Defaults that had to go

| Default | Overridden to | What breaks if you leave it |
|---|---|---|
| `android_ripple` unset | `{ color, foreground: true }` | No ripple at all, and with `foreground` left off the ripple draws *behind* the fill, where an opaque `backgroundColor` hides it. A filled button looks dead on press. |
| ripple survives `disabled` | `android_ripple={null}` while blocked | The ripple is a native drawable driven by the native touch, not by the JS responder, so a disabled button still acknowledges taps it is ignoring. |
| `overflow: 'visible'` | `'hidden'` on the button | The ripple is a square wash overhanging the `borderRadius`. |
| debug outline as a `borderWidth` | absolute overlay with `pointerEvents: 'none'` | 1pt of border inflates the Yoga box by 2. The first run of the icon screen reported **46x46** for a 44pt target — the outline falsified the measurement it existed to prove. |
| `borderRadius: 22` on the icon target | no radius; the circle comes from the ripple | Native hit-testing is rectangular, but CSS hit-testing honours `border-radius`. All four corners of the 44pt target went dead on web only. |
| `accessibilityState={{ busy }}` alone | plus `aria-busy={loading}` | react-native-web 0.21 maps `disabled` through to `aria-disabled` but drops `busy`. Verified: the attribute came back `null`. |
| `hitSlop` as the way to reach 44/48 | padding; slop is the fallback | Slop is not layout. It is invisible to a screenshot, ignored by react-native-web, and clipped by the parent — see below. |

## Feedback is per platform, not per taste

```tsx
android_ripple={USES_RIPPLE && !blocked ? { color: tokens.ripple, foreground: true } : null}
style={({ pressed }) => [ ..., pressed && !USES_RIPPLE && styles.pressed ]}
```

`USES_RIPPLE` gates both halves, so exactly one fires. Doing both on Android reads as two
acknowledgements of one tap. `USES_RIPPLE` is read once at module scope in
[`press-tokens.ts`](../../components/pressables/press-tokens.ts): `Platform.OS` cannot
change at runtime, and a module constant is harder to accidentally turn into a hook.

Ripple colour has to be a plain string. `android_ripple` is read by the native view config,
which cannot resolve the `DynamicColorIOS` / `PlatformColor` objects that
[`adaptive-colors.ts`](../../constants/adaptive-colors.ts) hands out everywhere else in
this repo.

## Blocked means blocked

One derived flag, `blocked = disabled || loading`, drives the visual, the ripple, the a11y
state and the press guard. Two computations of the same idea can disagree for a frame.

```tsx
accessibilityState={{ disabled: blocked, busy: loading }}
```

`busy` **and** `disabled` while loading, on purpose. A control that ignores taps has to
announce disabled, or VoiceOver invites a tap that does nothing; `busy` alone still reads
as actionable. Measured on the loading button:
`{role: "button", aria-disabled: "true", aria-busy: "true", aria-label: "Loading"}`.

Five forced clicks on each blocked button: `disabled 0 · loading 0`. `disabled` on the
Pressable already stops Pressability from calling `onPress`; the early return inside the
handler is kept anyway, so the guarantee belongs to the component rather than to a prop a
caller can forget.

The label stays mounted at `opacity: 0` under the spinner rather than being swapped out —
measured width `147` idle, `147` loading, so the button does not jump the instant it starts
working. That opacity is also why `accessibilityLabel` is stated explicitly: iOS treats a
zero-opacity view as hidden from the accessibility tree, so the button would otherwise lose
its name at exactly the moment it starts announcing "busy".

![AppButton variants and blocked states](./app-button-variants.png)

## Press latency, measured rather than quoted

[`press-latency-probe.tsx`](../../components/pressables/press-latency-probe.tsx) wraps a
button in a View whose `onTouchStart` records the raw touch, and hands the button an
`onPressIn` that records the difference. `onTouchStart` is a raw View touch event that
fires before the responder system decides anything; `onPressIn` fires after Pressability's
press delay. The gap between them is the real input latency on that device.

Three runs under Chrome touch emulation, one button at `unstable_pressDelay={0}` and one at
`{90}`:

```
run 1: pressDelay 0 -> +2ms | pressDelay 90 -> +1ms
run 2: pressDelay 0 -> +0ms | pressDelay 90 -> +1ms
run 3: pressDelay 0 -> +1ms | pressDelay 90 -> +0ms
```

Two things fall out. Feedback at `pressDelay={0}` is imperceptible — 0–2ms, an order of
magnitude under the ~100ms where a delay starts being felt. And **react-native-web 0.21
ignores `unstable_pressDelay` entirely**: the 90ms build measured identically to the 0ms
one. The prop is native-only.

What the delay is *for*: it delays the pressed visual, never `onPress`, which still fires on
release either way. The only place it earns its keep is a Pressable inside a scrollable,
where a 0ms highlight flashes on every scroll that happens to start on a button. So
`AppButton` defaults to `0` and exposes the knob; a row inside a `FlatList` is where you
turn it up.

## A 24pt glyph that reaches 44/48

![Three ways to ship a 24pt glyph, with the effective target drawn](./icon-target-44.png)

Three builds of the same glyph, with the effective target drawn as a dashed overlay and the
Pressable's own measured box printed underneath:

| Build | Measured box | Result |
|---|---|---|
| none | 24x24 | a tap 14px from the centre — comfortably inside a 44pt target — misses |
| `padding` | **44x44** | all four corners *and* all four edge midpoints register |
| `hitSlop` | 24x24 | outline says 44, box says 24, and the tap 6px outside misses on web |

The padding build is the one that ships. `ICON_PADDING = (MIN_TOUCH_TARGET - 24) / 2` — 12
on Android, 10 on iOS and web — is real layout, so it is what the parent hit-tests, it
survives `react-native-web`, and it shows up in `onLayout`. Where it costs too much space, a
negative margin gives the space back without touching the touch area; the "In place" card on
that screen does exactly that.

The two numbers are not interchangeable: 48 is Android's accessibility-scanner floor, 44 is
Apple's HIG minimum, so `MIN_TOUCH_TARGET` is a `Platform.select`, not a compromise.

`hitSlop` is the fallback for a layout that genuinely cannot grow. Note what the table shows:
a screenshot can never prove a hitSlop target, because slop is not layout and does not appear
in `onLayout`. Only the tap counter can — which is why the counters are on the screen.

## The bug: a target outside its parent is not a target

![The badge half outside its card](./clipping-broken.png)

The close badge is `position: 'absolute'` at `top: -22, right: -22` on a card, so exactly
half of it hangs over each of two edges. Measured geometry:

```
card  = 354x58 at (38, 251)          card right edge = 392, card top edge = 251
badge = 44x44  at (369, 230)         21px past the right edge, 21px above the top edge
```

It draws perfectly. **On iOS and Android only the overlapping quarter — x 369..392,
y 251..274 — accepts a tap.** The other three quarters are pixels, not a button.

### Why

Both platforms answer "which view owns this point?" by walking down the tree, and both
refuse to descend into a subtree whose own frame does not contain the point.

- **iOS**: `UIView.hitTest:withEvent:` calls `pointInside:withEvent:` on itself first and
  returns `nil` immediately if it fails — before it has looked at a single subview. The
  badge is never asked.
- **Android**: `ViewGroup.dispatchTouchEvent` only offers an event to its children after the
  group itself has been handed it, and it is handed only events inside its own bounds.

Drawing and hit-testing are two separate passes over the same tree, and the flags people
reach for — `overflow: 'visible'`, `clipChildren=false` — belong to the drawing pass. They
are why the badge is visible. They do nothing for the touch pass. There is no flag that
makes this work; the fix is structural. Either the parent grows to contain the target, or the
escaping element is hoisted to a parent that is already big enough. Toggling **Fix it** on
that screen does the first.

`hitSlop` obeys the identical rule: slop that extends past an ancestor's bounds is dead,
because that region was never the ancestor's to dispatch. This is the trap in "just add
hitSlop" — the second demo on that screen is a 24pt button pulled flush to the card's border
with `marginRight: -16`, so its 10pt of slop lies entirely outside the card.

### Why it ships

On web it does not reproduce. Verified: a click at (403, 263) — right of the card's edge and
on the badge — registered. DOM hit-testing does not clip a positioned descendant to its
parent's box unless `overflow` says so. So the whole thing works on the platform most people
develop the layout on, and breaks on the two they ship to.

## Stretch: what TouchableOpacity costs

[`touchable-app-button.tsx`](../../components/pressables/touchable-app-button.tsx) is the
same button, same props, same layout. Three capabilities are gone, and one that is commonly
claimed is not.

**1. `android_ripple`, with no substitute.** No Touchable takes a ripple prop except
`TouchableNativeFeedback`, which is Android-only, has no iOS or web fallback, and requires a
single native child. So the branch moves from a prop to the component: you ship two different
components per platform instead of one component with a platform-gated prop. In the meantime
the button fades on Android — identical on both platforms, which is precisely what
"platform-idiomatic feedback" rules out.

**2. No `pressed` state to read.** `Pressable` takes `style` and `children` as functions of
`{ pressed }`. `TouchableOpacity` exposes no press state at all, so a pressed *background*,
border, elevation, transform, or glyph colour is simply unreachable through `style`. The
workaround is to wire `onPressIn`/`onPressOut` into your own `useState`, which re-renders the
subtree on every touch and puts a render inside the gesture. The declarative version costs
nothing.

**3. `activeOpacity` fades the whole subtree.** There is one pressed channel and it is
opacity applied to everything inside. "The surface darkens but the label stays solid" cannot
be expressed. Nor can the fade differ by contrast: this kit's ghost `secondary` and filled
`danger` are stuck with the same number.

**Not lost:** press timing. `delayPressIn` / `delayPressOut` / `delayLongPress` all exist on
`TouchableOpacity`; `unstable_pressDelay` is the same idea renamed. And nothing about
accessibility changes — `accessibilityRole`, `accessibilityState`, `hitSlop` and `disabled`
live on `View`, not on `Pressable`, so all of that ports across untouched. The gap is
entirely in the feedback layer.

## Limits

- **Every measurement here is from the web build.** react-native-web diverges on three of the
  things this drill is about: it ignores `hitSlop`, it ignores `unstable_pressDelay`, and it
  does not reproduce the clipping bug. So the web run proves the padding strategy and the
  blocked-state behaviour, and the clipping and hitSlop claims rest on the platform
  hit-testing rules cited above, not on a run. The on-screen tap counters exist so the same
  checks can be repeated by hand on a device; that run has not happened.
- One consequence: the flush-slop button rejecting a tap 6px past the card's edge is **not**
  evidence of clipping. On web it fails because hitSlop is unsupported at all. Worth knowing
  when you repeat these checks; not worth citing as proof.
- `foreground: true` needs Android API 23+. Below that the ripple silently falls back behind
  the content, which is the invisible-ripple failure the table describes.
- Whether the ripple respects `borderRadius` on the new architecture is asserted from
  `overflow: 'hidden'`, not observed. First thing to check on a real Android device.
- `aria-busy="false"` is emitted on every non-loading button. Harmless, but it is noise that
  a stricter audit might flag.
