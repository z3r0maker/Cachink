/**
 * `<DateField>` — desktop / web (Tauri) variant.
 *
 * Vite-based tools (Vitest, Storybook, Tauri) resolve this file via the
 * default import chain `./date-field → ./date-field.tsx`. Metro picks
 * `./date-field.native.tsx` on RN.
 *
 * Renders the brand `<Input type="date">` so the native browser
 * date-picker pops on click. Tauri's WebKit/WebView2 honour
 * `<input type="date">` and produce the platform-native modal calendar
 * — no JS calendar lib needed.
 */
import type { ReactElement } from 'react';
import { Input } from '../Input/input';
import type { DateFieldProps } from './date-field.shared';

export type { DateFieldProps } from './date-field.shared';

export function DateField(props: DateFieldProps): ReactElement {
  return (
    <Input
      type="date"
      value={props.value}
      onChange={props.onChange}
      label={props.label}
      placeholder={props.placeholder}
      note={props.note}
      testID={props.testID ?? 'date-field'}
      ariaLabel={props.ariaLabel ?? props.label}
    />
  );
}
