/**
 * `<DateField>` — shared types + visual styling.
 *
 * The platform variants (`./date-field.web.tsx`, `./date-field.native.tsx`)
 * own their own implementation but re-use this header so the prop
 * contract stays in exactly one place (CLAUDE.md §2).
 *
 * Closes audit blocker 1.3: `<Input type="date">` rendered as a plain
 * text field on RN. The web variant continues to use the native HTML
 * `<input type="date">` (which works in Tauri webview), and the native
 * variant ships a `<Modal>`-backed date picker that doesn't require a
 * platform dependency — defer the `@react-native-community/datetimepicker`
 * upgrade to a follow-up so this PR stays pnpm-install-free for mobile.
 */
import type { ReactElement } from 'react';

/**
 * ISO 8601 date string in the `YYYY-MM-DD` form. Same shape as the
 * `IsoDate` brand from `@cachink/domain`. Empty string represents an
 * empty field (the form has not committed a value yet).
 */
export type IsoDateString = string;

export interface DateFieldProps {
  /** ISO 8601 date string (`YYYY-MM-DD`) or empty string. */
  readonly value: IsoDateString;
  /** Fired with the new ISO date or `""` when the user clears it. */
  readonly onChange: (value: IsoDateString) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly note?: string;
  readonly testID?: string;
  readonly ariaLabel?: string;
  /** Lower bound (inclusive). ISO date string. */
  readonly min?: IsoDateString;
  /** Upper bound (inclusive). ISO date string. */
  readonly max?: IsoDateString;
}

/**
 * Marker re-exported so consumers can land the type without picking a
 * platform variant.
 */
export type DateFieldComponent = (props: DateFieldProps) => ReactElement;
