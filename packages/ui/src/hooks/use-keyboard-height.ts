/**
 * useKeyboardHeight — how many points of the screen bottom the soft keyboard
 * covers (0 when hidden). Bottom sheets lift themselves by this amount: a
 * KeyboardAvoidingView inside an absolutely positioned portal sheet measured
 * its overlap wrong on iPad and left the whole sheet under the keyboard.
 *
 * iOS fires the "will" events in step with the keyboard animation; Android
 * only reliably fires the "did" events.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
