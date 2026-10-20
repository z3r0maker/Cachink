/**
 * The iOS keyboard's height while it covers the screen, else 0.
 *
 * A bottom-anchored sheet is position-pinned to the screen's bottom edge, so
 * a KeyboardAvoidingView's padding cannot lift it (absolute positioning
 * ignores the parent's padding) and the sheet's footer ends up BEHIND the
 * keyboard — on a phone-pad there is no dismiss key, so the save action is
 * unreachable until the sheet itself rides up (the M-11 regression's
 * stuck-guardar case). Consumers apply the height as a bottom margin.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardHeight(): number {
  const [altura, setAltura] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    // Will-* variants fire with the animation on iOS, so the sheet tracks it.
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      setAltura(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setAltura(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return altura;
}
