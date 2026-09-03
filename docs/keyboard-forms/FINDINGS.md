# A controlled form that survives the keyboard

FieldKit's note composer. Expo SDK 54.0.36 / RN 0.81.5 / react-native-web 0.21, React Compiler on.

Screen: [`app/lab/note-composer.tsx`](../../app/lab/note-composer.tsx) →
[`components/composer/note-composer.tsx`](../../components/composer/note-composer.tsx).

Four defaults had to be overridden to get from "a form" to "a form you can actually use with the
keyboard up". Each one is a default that is correct somewhere else.

| Default | Overridden to | What breaks if you leave it |
|---|---|---|
| `ScrollView keyboardShouldPersistTaps="never"` | `"handled"` | The first tap on any control is eaten by the keyboard dismissal and never delivered. Title → Tags takes two taps. |
| single-line `submitBehavior="blurAndSubmit"` | `"submit"` on Title | Return blurs the title before `onSubmitEditing` moves focus, so the keyboard tears down and slides back up. |
| `KeyboardAvoidingView keyboardVerticalOffset={0}` | `useHeaderHeight()` | Under-lifts by exactly the header height, because the avoider measures its frame relative to its parent, not the screen. |
| Save button inside the ScrollView | Sibling of it | On a 667pt screen the button scrolls off under the keyboard instead of riding above it. |

## `keyboardShouldPersistTaps` is the whole ballgame

`"handled"` is the only value that satisfies both halves of the requirement at once:

- a tap a child *claims* (the tag input, a chip) is delivered on the first press, and
- a tap that lands on empty space is not claimed, so it falls through to the dismissal.

`"never"` (the default) gives you dismissal but costs the first tap. `"always"` gives you the first
tap but never dismisses. There is no third option, and no `TouchableWithoutFeedback` wrapper is
needed — `contentContainerStyle: { flexGrow: 1 }` is what makes the empty area below the fields
part of the ScrollView, and therefore a valid "outside".

The Save button is a sibling of the ScrollView, not a child, so `keyboardShouldPersistTaps` never
governs it: a tap on it is unconditionally delivered on the first press, keyboard up or down.

## `blurOnSubmit` is gone

RN 0.79 replaced `blurOnSubmit: boolean` with `submitBehavior: 'submit' | 'blurAndSubmit' | 'newline'`.
The two fields want opposite things and both are stated rather than inherited:

```tsx
<ComposerField returnKeyType="next" submitBehavior="submit"
  onSubmitEditing={() => bodyRef.current?.focus()} />   // title: hand focus on, keep the keyboard

<ComposerField multiline submitBehavior="newline" />    // body: Return types a newline
```

`"newline"` is already the multiline default. It is written out because it is the requirement, and
a later `returnKeyType` on that field would otherwise silently look like it should submit.

Confirmed in the installed `TextInput.js` — the defaults really do diverge by line count:

```js
} else if (multiline) {                       // -> 'newline'
} else {                                      // single line
  if (props.blurOnSubmit !== false) { submitBehavior = 'blurAndSubmit'; }
```

So the title's `"submit"` is load-bearing and the body's `"newline"` is a restatement.

## Validation has one source of truth

`titleError` is recomputed on every render from `draft.title` — never mirrored into state. The red
border, the counter colour, the message and the button's `disabled` all read that one value, so
they cannot disagree for a frame. `commit()` re-checks it independently and returns `null` rather
than trusting the caller to have honoured `canSave`.

Two details the rules turn on:

- **Whitespace-only is empty.** `'   '.trim().length === 0`, so three spaces do not unlock Save.
- **No `maxLength` on the title.** Capping the input would make the over-60 state unreachable and
  the validation untestable. The limit is enforced by the rule, not by the keyboard.

The border is `borderWidth: 2` with `borderColor: 'transparent'` when valid, not a border that
appears on error — an appearing border reflows the field and nudges the form down two pixels.

## The counter (Lesson 13 preview)

[`title-counter.tsx`](../../components/composer/title-counter.tsx) shows `19/60` and announces
"41 characters left". A slash read aloud is noise, so the visual string and the accessible string
are deliberately different, and the count is pluralised — "1 character over the limit".

`accessibilityLiveRegion="polite"` re-announces on change without pulling focus out of the input.
**It is Android-only in React Native.** iOS exposes no live-region concept through this prop and
needs `AccessibilityInfo.announceForAccessibility` instead — not wired up here, and the honest gap
in the stretch goal. The other known cost: Android announces on *every* keystroke, which is
correct and chatty. Gating it to the last ten characters would be quieter and would also be a
different feature than the one asked for.

## Verified

Chrome (system, headless) against Metro web at 375 × 667 — the iPhone SE viewport — driven by
Playwright. Every value observed, not derived.

| Title | counter | announced | border | Save |
|---|---|---|---|---|
| `''` | `0/60` | 60 characters left | `rgb(229,72,77)` | `aria-disabled="true"` |
| `'    '` | `4/60` | 56 characters left | `rgb(229,72,77)` | `aria-disabled="true"` |
| `'Ported the chat row'` | `19/60` | 41 characters left | `rgba(0,0,0,0)` | enabled |
| 60 × `y` | `60/60` | 0 characters left | `rgba(0,0,0,0)` | enabled |
| 61 × `x` | `61/60` | 1 character over the limit | `rgb(229,72,77)` | `aria-disabled="true"` |

- Body renders as a `<textarea>`; typing `line one` ⏎ `line two` yields `"line one\nline two"`.
- `rn, layout , #keyboard, RN,,` → chips `#rn #layout #keyboard` — trimmed, `#` stripped,
  case-insensitively de-duplicated, order preserved.
- Save button box at 375 × 667: `x 16, y 607, w 343, h 48`. Fully on screen, and 48dp exactly —
  the Android touch-target floor.
- Saving clears all three fields and re-disables the button; the summary reads `Saved · 3 tags`.
- Console is clean apart from a `404 /favicon.ico` from the dev server, which this project has
  never configured and which appears on every screen in the lab.

## Limits

**The keyboard itself was not tested.** react-native-web has no software keyboard, so
`KeyboardAvoidingView`, `keyboardShouldPersistTaps`, `submitBehavior` and `useKeyboardVisible` are
all inert on the only runtime available on this machine — no Xcode simulators, no `adb`. What the
browser run proves is the controlled state, the validation, the newline behaviour, the tag parsing
and the Save button's geometry on an SE-sized viewport. What it does not prove is that the button
clears a real IME.

Two claims to check first on device:

1. **`behavior="padding"` on Android.** It is correct only if the window does not resize under the
   keyboard, which is what the edge-to-edge layout RN 0.81 targets should give. If a small Android
   phone lifts the footer by roughly *twice* the keyboard height, the window is resizing after all
   and Android wants `behavior={undefined}`.
2. **`keyboardVerticalOffset={useHeaderHeight()}`.** The *mechanism* is confirmed in the installed
   `KeyboardAvoidingView.js`: the padding branch returns `frame.y + frame.height - keyboardY`,
   where `frame` comes from `event.nativeEvent.layout` (parent-relative, so `frame.y ≈ 0` under a
   Stack screen) and `keyboardY` is `keyboardFrame.screenY` (absolute) minus the offset. Mixing
   the two coordinate spaces is exactly the gap the offset closes. What is unverified is only
   whether `useHeaderHeight()` returns the true distance from the screen top to the avoider's
   parent origin on each platform. If the footer lifts by the keyboard height *minus* the header,
   it does not.
