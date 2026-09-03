import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * True while the software keyboard is on screen.
 *
 * Used for one thing only: collapsing the composer footer's safe-area padding. With the
 * keyboard up the home indicator / gesture bar is covered by the keyboard, so reserving
 * space for it would leave a dead gap between the Save button and the keys.
 *
 * iOS listens to the `Will` pair so the footer resizes on the same frame the keyboard
 * starts sliding; Android only ever emits the `Did` pair.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? ('keyboardWillShow' as const) : ('keyboardDidShow' as const);
    const hideEvent = Platform.OS === 'ios' ? ('keyboardWillHide' as const) : ('keyboardDidHide' as const);

    const subscriptions = [
      Keyboard.addListener(showEvent, () => setVisible(true)),
      Keyboard.addListener(hideEvent, () => setVisible(false)),
    ];

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return visible;
}
