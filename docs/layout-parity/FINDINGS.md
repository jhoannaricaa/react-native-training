# Porting CSS flexbox to React Native

Two ports and the defaults that break them. Expo SDK 54.0.36 / RN 0.81.5 / react-native-web 0.21.

Measured at a 390 × 844 viewport, `deviceScaleFactor: 2`, via Playwright driving system Chrome
against Metro web. Every number below was observed, not derived.

**How "identical" was checked.** No Xcode and no Android SDK on this machine, so the ports were
verified against the *other* side of the port instead: the original CSS was rendered as plain HTML
at the same viewport with the same font stack, and its geometry diffed against the RN Web output.
See [Limits](#limits) for what that does and does not prove.

## Part 1 — wrapping card row

Source: [`app/lab/card-row-wrap.tsx`](../../app/lab/card-row-wrap.tsx)

The web original:

```css
.card-row {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 12px 16px;
  padding: 16px;
  height: 320px;
}
.card {
  flex: 0 1 140px;
  padding: 12px;
  border-radius: 8px;
}
```

Seven rewrites, none of them cosmetic:

| CSS | React Native | Why |
|---|---|---|
| `display: flex` | *(nothing)* | Every RN `View` is already a flex container. |
| *(implied `row`)* | `flexDirection: 'row'` | **RN defaults to `column`.** Omit this and the row is a column. |
| `flex-wrap: wrap` | `flexWrap: 'wrap'` | Same name, same default (`nowrap`). |
| `align-content: flex-start` | `alignContent: 'flex-start'` | **CSS defaults to `stretch`, Yoga to `flex-start`.** Values agree here only because the original said so. |
| `gap: 12px 16px` | `rowGap: 12`, `columnGap: 16` | RN's `gap` takes one number; there is no two-value shorthand. |
| `flex: 0 1 140px` | `flexGrow: 0`, `flexShrink: 1`, `flexBasis: 140` | **RN's `flex: n` is not CSS's.** It means grow `n` / shrink 1 / basis 0, so `flex: 0` would not reproduce this. |
| `16px`, `320px`, `8px` | `16`, `320`, `8` | Unitless density-independent numbers. |
| `box-sizing: border-box` | *(nothing)* | RN has no other box model, so padding is already inside the 320. |

Parity — RN Web vs. the same CSS as hand-written HTML, card boxes measured relative to the
container:

| | container | card w × h | card origins (x, y) | rows | bottom slack |
|---|---|---|---|---|---|
| RN Web | 358 × 320 | 140 × 58 | (17,17) (173,17) (17,87) (173,87) (17,157) (173,157) | 3 | 104 |
| CSS original | 358 × 320 | 140 × 58 | (17,17) (173,17) (17,87) (173,87) (17,157) (173,157) | 3 | 104 |

Identical on every value. The 104 of slack at the bottom is `alignContent: 'flex-start'` doing its
job — under CSS's `stretch` default the three rows would have absorbed it.

| RN Web | the CSS original |
|---|---|
| ![card row, light](card-row-light.png) | ![CSS original](css-original-light.png) |

## Part 2 — chat bubble row

Source: [`components/chat/chat-bubble-row.tsx`](../../components/chat/chat-bubble-row.tsx),
screen at [`app/lab/chat-bubble-row.tsx`](../../app/lab/chat-bubble-row.tsx)

Four requirements, four styles that carry them:

| Requirement | Style |
|---|---|
| Fixed 40dp avatar | `avatarSlot`: `width/height: 40`, `flexGrow: 0`, `flexShrink: 0`, `flexBasis: 40` |
| Body grows and wraps | `body`: `flexGrow: 1`, `flexShrink: 1`, `flexBasis: 0`, `minWidth: 0` |
| Timestamp never shrinks | `timestamp`: `flexShrink: 0`, `flexBasis: 'auto'` |
| Unread dot on the avatar | `avatarSlot`: `position: 'relative'` + `unreadDot`: `position: 'absolute'`, `top/right: -2` |

### The annotated diff

The four differences the port required. `-` is the web original, `+` is the React Native form:

```diff
  .row / styles.row
- /* flex-direction defaults to row */
+ flexDirection: 'row',
```
**Difference 1 — `flexDirection`.** CSS flex containers default to `row`; RN defaults to `column`.
This is the only one of the four that CSS never has to state and RN always does.

```diff
  .msgbody / styles.body
- flex: 1 1 0;              /* shrink: 1 is the CSS default anyway */
+ flexGrow: 1,
+ flexShrink: 1,            /* RN's default is 0 */
+ flexBasis: 0,
```
**Difference 2 — `flexShrink`.** CSS defaults flex items to `1`, RN to `0`. Without the explicit
`1` the bubble sizes to its content and shoves everything to its right off-screen.

```diff
  .ts / styles.timestamp
- flex: 0 0 auto;           /* the 0 shrink has to be written on the web */
+ flexShrink: 0,            /* already RN's default; written to survive a port back */
+ flexBasis: 'auto',
```
**Difference 2, other direction.** The same default asymmetry, flipped: what the web has to ask
for, RN gets for free. Stating it keeps the intent readable in both languages.

```diff
  .avatar-slot / styles.avatarSlot
- position: relative;       /* without this the dot escapes to an ancestor */
+ position: 'relative',     /* already RN's default; the dot cannot escape */
```
**Difference 3 — `position`.** CSS defaults to `static`, RN to `relative`. In CSS an absolute
child hunts up the tree for the nearest non-static ancestor; in RN every parent is a containing
block, so the dot resolves against `avatarSlot` no matter what. It is declared anyway, because
the guarantee should be visible where the dot is defined rather than inferred from a default.

```diff
  .msgbody / styles.body
- min-width: 0;             /* CSS flex items default to min-width: auto */
+ minWidth: 0,              /* Yoga has no min-content floor */
```
**Difference 4 — the automatic minimum size.** CSS gives flex items `min-width: auto`, a
min-content floor that blocks shrinking. Yoga has no equivalent. This is the one difference that
only bites on the web side of the port — see the control below.

Also worth recording, though not a layout default: RN's `TextProps` already owns a `role` prop for
accessibility, so a `role?: ColorRole` of one's own intersects with it to `never`. The prop in
[`components/themed-text.tsx`](../../components/themed-text.tsx) is called `tone` for that reason.

### Negative control

[`app/lab/chat-row-defaults.tsx`](../../app/lab/chat-row-defaults.tsx) renders the same row with
exactly one fix removed per case. Row box is 390 wide; negative "timestamp past row" means inside.

| Case | body w | timestamp past row right | dot offset from avatar | Result |
|---|---|---|---|---|
| all four ported | 241 | −16 | (30, −2), on avatar | correct |
| 1 · `flexDirection` omitted | 358 | −321 | (30, −2) | body and timestamp stack vertically, text spills over the next row |
| 2 · `flexShrink` left at RN's `0` | **1038** | **+781** | (30, −2) | bubble sizes to its content, timestamp 781 off-screen |
| 3 · avatar parent `static` | 241 | −16 | **(364, −10), off avatar** | dot re-anchors to the row and lands at its top-right corner |
| 4 · unbreakable 160-char token, `minWidth` dropped | 241 | −16 | (30, −2) | unchanged — no floor to hit |

![defaults left un-ported](chat-row-defaults-light.png)

Case 4 needs the CSS half to mean anything. Same row, same token, in hand-written CSS:

| `.msgbody` | computed `min-width` | body w | timestamp past row right |
|---|---|---|---|
| `min-width: 0` | `0px` | 241 | −16 |
| declaration removed | `auto` | **1277** | **+1020** |

So `minWidth: 0` is load-bearing in CSS and inert in Yoga. On react-native-web it is also inert,
but for a third reason: RNW's own `View` reset already computes `min-width: 0px`, verified on the
case-4 body with the declaration dropped. Two caveats on that control: the floor is min-*content*,
so ordinary prose never reaches it — a 400-character sentence of normal words measures identically
with `auto` and with `0`, and only an unbreakable token exposes the difference; and it applies only
while `overflow` is `visible`, so an `overflow: hidden` bubble masks it too.

### The 400-character message

[`app/lab/chat-bubble-row.tsx`](../../app/lab/chat-bubble-row.tsx) carries a message of exactly 400
characters. Middle row, measured:

| Metric | Value |
|---|---|
| message length | 400 chars |
| row box | 390 × 344 |
| avatar | 40 × 40 |
| body | 240.9 × 328 |
| timestamp | `10:26 PM`, 53.1 wide, right edge at 374 of 390 |
| timestamp clipped (`scrollWidth > clientWidth`) | no |
| document horizontal overflow | no |
| unread dot | 12 × 12 at (−2, −2) from the avatar's top-right corner |

The same three rows measured against the equivalent hand-written CSS: every value matched —
row heights 92 / 344 / 92, body widths 241 / 240.9 / 242.8, timestamp widths 53 / 53.1 / 51.2,
all timestamps 16 inside the row's right edge, dot at (−2, −2).

## ThemedText

[`components/themed-text.tsx`](../../components/themed-text.tsx) over
[`constants/adaptive-colors.ts`](../../constants/adaptive-colors.ts). Three colour paths:

| Platform | Source | Who resolves the theme |
|---|---|---|
| iOS | `DynamicColorIOS({ light, dark })` | UIKit, at draw time — no React re-render |
| Android | `PlatformColor('?android:attr/textColorPrimary')` etc. | the activity theme, which must be DayNight |
| web / anything else | hex, keyed by `useColorScheme()` | React, on the scheme change |

One trap worth the comment it carries: `Platform.select` is an object literal, so every branch is
evaluated. `Platform.select({ ios: DynamicColorIOS(...), android: PlatformColor(...) })` throws on
Android, because `DynamicColorIOS` is a throwing stub there. The colour maps are built behind
`Platform.OS` ternaries, which stay lazy.

`useColorScheme()` is still called unconditionally — hooks rules — but its value is read only on
the fallback path.

| light | dark |
|---|---|
| ![chat row, light](chat-row-light.png) | ![chat row, dark](chat-row-dark.png) |

Both captured with Chrome's `prefers-color-scheme` emulation, which is what `useColorScheme()`
reads on web. The expo-router web header stays light in both — it is outside `ThemedText` and was
left alone.

## Limits

- **The native colour paths are unverified.** No Xcode and no Android SDK on this machine, so
  `DynamicColorIOS` and `PlatformColor` are code-complete but never executed. The screenshots above
  exercise the hex fallback only. `?android:attr/colorBackgroundFloating` in particular wants
  checking on a device — it needs API 26+ and a DayNight activity theme to flip.
- **"Identical on both platforms" is argued, not measured on two platforms.** What was measured is
  RN Web against the original CSS, at pixel equality. The properties the port turns on are the ones
  where Yoga and CSS *disagree by default*, which is what makes the claim portable — but a
  simulator run is what would settle it.
- The card row's 320 height and border exist to make `alignContent` observable. Real cards would
  not fix a height.
