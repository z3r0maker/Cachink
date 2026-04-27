/**
 * `<TextField>` — labelled text input. Default field primitive.
 *
 * Thin wrapper around `<Input>` that surfaces the new keyboard /
 * focus-flow props (`returnKeyType`, `onSubmitEditing`, `blurOnSubmit`)
 * with sensible defaults so callers don't need to know about the
 * underlying `<Input>` shape. For typed variants reach for the
 * specialized siblings:
 *
 *   - `<MoneyField>` — peso amounts, formats on blur, exposes `Money` bigint
 *   - `<EmailField>` — email keyboard + autofill
 *   - `<PhoneField>` — tel keyboard + autofill
 *   - `<PasswordField>` — masked, with show/hide toggle
 *   - `<IntegerField>` — strips non-digits, clamps to min/max
 *   - `<DateField>` — platform-native date picker
 */
import type { ReactElement } from 'react';
import { Input } from '../Input/input';

export interface TextFieldProps {
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
  readonly autoComplete?: string;
}

export function TextField(props: TextFieldProps): ReactElement {
  return (
    <Input
      type="text"
      value={props.value}
      onChange={props.onChange}
      label={props.label}
      placeholder={props.placeholder}
      note={props.note}
      testID={props.testID ?? 'text-field'}
      ariaLabel={props.ariaLabel ?? props.label}
      returnKeyType={props.returnKeyType}
      onSubmitEditing={props.onSubmitEditing}
      blurOnSubmit={props.blurOnSubmit}
      autoComplete={props.autoComplete}
    />
  );
}
