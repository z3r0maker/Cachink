/**
 * `KeyboardAwareForm` — the standard scroll shell for any full-screen
 * form in Cachink (review item #3).
 *
 * The bug it fixes: a centered `flex: 1` column has nowhere to go when
 * the soft keyboard opens, so the primary action (GUARDAR) gets pushed
 * under the keyboard with no way to reach it. On a phone that is a
 * dead end — the user cannot submit the form at all.
 *
 * Three behaviours, all required together:
 *   - `KeyboardAvoidingView` with `padding` on iOS so the content pane
 *     shrinks instead of being overlapped.
 *   - `ScrollView` with `flexGrow: 1` so the column still centers when
 *     it fits, and scrolls when it doesn't.
 *   - `keyboardShouldPersistTaps="handled"` so the first tap on a
 *     button lands on the button instead of being eaten by the
 *     keyboard-dismiss gesture.
 *
 * `dismissKeyboard` is re-exported here so option pickers (which are
 * not text inputs) can close the keyboard on select rather than
 * leaving it hanging over the rest of the form.
 */

import type { ReactElement, ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export interface KeyboardAwareFormProps {
  readonly children: ReactNode;
  /** Padding around the scrolling content. Defaults to 24. */
  readonly padding?: number;
  /** Gap between direct children. Defaults to 16. */
  readonly gap?: number;
  readonly testID?: string;
}

/**
 * Closes the soft keyboard. Call from non-text controls (option cards,
 * segmented pickers) so focus doesn't stay trapped in a text field.
 */
export function dismissKeyboard(): void {
  Keyboard.dismiss();
}

export function KeyboardAwareForm(props: KeyboardAwareFormProps): ReactElement {
  const { padding = 24, gap = 16 } = props;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        testID={props.testID}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding,
          gap,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {props.children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
