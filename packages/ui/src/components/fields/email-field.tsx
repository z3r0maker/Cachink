/**
 * `<EmailField>` — labelled email input.
 *
 * Closes audit finding 1.6: existing email inputs (cliente form, Cloud
 * onboarding, password reset) used the alpha keyboard. Wraps `<Input>`
 * in `email` mode so:
 *
 *   - `keyboardType="email-address"` on RN (no spacebar, `@` close at hand)
 *   - `inputMode="email"` on web
 *   - `autoCapitalize="none"` and `autoCorrect={false}` so `@` and `.` aren't capitalised or autocorrected
 *   - `autoComplete="email"` triggers OS / browser autofill
 *
 * Validation is the caller's responsibility — typically a Zod schema
 * applied at form submit. Keystroke-time validation produces too many
 * red-state false positives for an email-shaped field.
 */
import type { ReactElement } from 'react';
import { Input } from '../Input/input';

export interface EmailFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly note?: string;
  readonly testID?: string;
  readonly ariaLabel?: string;
  readonly returnKeyType?: 'default' | 'next' | 'done' | 'go' | 'send' | 'search';
  readonly onSubmitEditing?: () => void;
  readonly blurOnSubmit?: boolean;
}

export function EmailField(props: EmailFieldProps): ReactElement {
  return (
    <Input
      type="email"
      value={props.value}
      onChange={props.onChange}
      label={props.label}
      placeholder={props.placeholder ?? 'tu@correo.com'}
      note={props.note}
      testID={props.testID ?? 'email-field'}
      ariaLabel={props.ariaLabel ?? props.label}
      returnKeyType={props.returnKeyType}
      onSubmitEditing={props.onSubmitEditing}
      blurOnSubmit={props.blurOnSubmit}
    />
  );
}
