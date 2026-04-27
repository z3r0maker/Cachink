/**
 * `<PhoneField>` — labelled phone-number input.
 *
 * Closes audit finding 1.5: cliente phone field rendered the alpha
 * keyboard. Wraps `<Input>` in `phone` mode so:
 *
 *   - `keyboardType="phone-pad"` on RN (digit grid + `+`, `*`, `#`)
 *   - `inputMode="tel"` on web
 *   - `autoCapitalize="none"` + `autoCorrect={false}`
 *   - `autoComplete="tel"` for OS / browser phone autofill
 *
 * No formatting is applied — Mexican phone numbers vary in shape (10
 * digits domestic, +52 with country code, sometimes parentheses for
 * area). The screen's Zod schema validates submit-time.
 */
import type { ReactElement } from 'react';
import { Input } from '../Input/input';

export interface PhoneFieldProps {
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

export function PhoneField(props: PhoneFieldProps): ReactElement {
  return (
    <Input
      type="phone"
      value={props.value}
      onChange={props.onChange}
      label={props.label}
      placeholder={props.placeholder ?? '55 1234 5678'}
      note={props.note}
      testID={props.testID ?? 'phone-field'}
      ariaLabel={props.ariaLabel ?? props.label}
      returnKeyType={props.returnKeyType}
      onSubmitEditing={props.onSubmitEditing}
      blurOnSubmit={props.blurOnSubmit}
    />
  );
}
