import type { RefObject } from 'react';
import type { TextInput } from 'react-native';

/**
 * Focus a TextInput ref — collapses the repeated
 * `() => (ref.current as TextInput | null)?.focus()` cast pattern
 * used across form focus-chain wiring.
 */
export function focusRef(ref: RefObject<unknown> | undefined): void {
  (ref?.current as TextInput | null)?.focus();
}
