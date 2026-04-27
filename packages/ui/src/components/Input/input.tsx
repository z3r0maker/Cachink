/**
 * Input — desktop / web (Tauri) variant.
 *
 * Matches the prop contract from the `cachink-v3.jsx` mock verbatim
 * (`label, value, onChange, type, placeholder, options, note`) so a
 * mock-to-production migration is mechanical. Renders one of two branches:
 *
 *   • text / number / date / email / phone / password / decimal →
 *     Tamagui's cross-platform `<Input>` primitive from `@tamagui/input`
 *     (lives in `./input-shared`). One implementation, both targets.
 *     `<PasswordField>` adds the show/hide toggle on top of this branch.
 *   • select (or any time `options` is provided) → delegates to the
 *     shared `<Combobox>` primitive (anchored Tamagui Popover). Replaces
 *     the previous native HTML `<select>` so the picker styling matches
 *     the brand and behaves the same on every platform.
 *
 * Vite-based tools (Vitest, Storybook, Tauri) resolve this file via the
 * default import chain `./index.ts → ./input.tsx`. Metro ignores it and
 * picks `./input.native.tsx` on mobile.
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows.
 *
 * ## Audit PR 2 additions
 *
 * The `<Input>` API now passes through `returnKeyType`,
 * `onSubmitEditing`, `blurOnSubmit`, and `autoComplete` so forms can
 * wire Enter-to-advance / Enter-to-submit behaviour without dropping
 * down to platform-specific code. See `<TextField>` in
 * `./input-shared.tsx` for the keyboard-hint resolution.
 */
import type { ReactElement, RefObject } from 'react';
import { View } from '@tamagui/core';
import { Combobox, type ComboboxOption } from '../Combobox/index';
import {
  InputLabel,
  InputNote,
  ROW_MARGIN_BOTTOM,
  TextField,
  type FieldProps,
  type InputType,
} from './input-shared';

export type { InputType };

export interface InputProps {
  /** Controlled string value. Empty string for no selection / empty input. */
  readonly value: string;
  /** Called with the new string on every keystroke / select change. */
  readonly onChange: (value: string) => void;
  /** Uppercase label rendered above the field. Optional. */
  readonly label?: string;
  /**
   * Which underlying control to render. `text` / `number` / `date` /
   * `email` / `phone` / `password` / `decimal` pass through to Tamagui's
   * cross-platform `<Input>` primitive; `select` (or passing `options`)
   * delegates to `<Combobox>` — an anchored popover picker styled to
   * the brand.
   */
  readonly type?: InputType;
  readonly placeholder?: string;
  /**
   * When present (or `type === 'select'`), renders a Combobox with one
   * option per entry. Strings are mapped to `{ key: s, label: s }`
   * internally so existing call sites keep their `readonly string[]`
   * API.
   */
  readonly options?: readonly string[];
  /** Small muted help text rendered below the field. Optional. */
  readonly note?: string;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
  /**
   * Explicit screen-reader label. Defaults to `label` when both are
   * provided; omit when the field is accompanied by a visible label.
   *
   * Named `ariaLabel` per ADR-034 — Tamagui 2.x consumes `aria-label`
   * natively, so we no longer translate from RN-style
   * `accessibilityLabel`.
   */
  readonly ariaLabel?: string;
  /**
   * `'next'` shows an "advance" return key on iOS; `'done'` shows
   * "Listo" and is the conventional last-field hint.
   */
  readonly returnKeyType?: 'default' | 'next' | 'done' | 'go' | 'send' | 'search';
  /** Called when the user taps Return / Enter on the soft keyboard. */
  readonly onSubmitEditing?: () => void;
  /** `false` keeps focus on this field after Enter (intermediate fields). */
  readonly blurOnSubmit?: boolean;
  /**
   * Override the platform autofill token. Use `'current-password'` /
   * `'new-password'` to differentiate sign-in vs sign-up forms.
   */
  readonly autoComplete?: string;
  /** Imperative ref to the underlying TextInput. */
  readonly inputRef?: RefObject<unknown>;
  /** Fires on focus loss — used by `<MoneyField>` to format on blur. */
  readonly onBlur?: () => void;
}

interface SelectFieldProps extends FieldProps {
  readonly label?: string;
}

/**
 * `<Combobox>`-backed select. Maps the legacy `readonly string[]`
 * options into `{ key, label }` so call sites don't change.
 *
 * The Input wrapper's `testID` is intentionally **not** forwarded
 * here — it stays on the outer View so existing E2E selectors
 * (`getByTestId('business-regimen')`, `getByTestId('input-pick')`,
 * etc.) keep returning a single match. The trigger uses Combobox's
 * default `combobox-trigger` handle for cases where a test needs to
 * fire a tap directly.
 */
function SelectField(props: SelectFieldProps): ReactElement {
  const items: readonly ComboboxOption[] = (props.options ?? []).map((s) => ({
    key: s,
    label: s,
  }));
  return (
    <Combobox
      value={props.value}
      options={items}
      onChange={props.onChange}
      placeholder={props.placeholder ?? 'Seleccionar...'}
      // Long lists (e.g. NIF categoría sets) benefit from typeahead
      // without forcing every two-option picker to render a search row.
      // Mirror the design heuristic: enable when the list grows past
      // ~6 options, the same threshold the Round-2 plan called out.
      searchable={items.length > 6}
      ariaLabel={props.ariaLabel ?? props.label}
    />
  );
}

/** Branches between the Tamagui `<Input>` and the `<Combobox>` picker. */
function InputField(props: SelectFieldProps): ReactElement {
  const useSelect = props.type === 'select' || Array.isArray(props.options);
  return useSelect ? <SelectField {...props} /> : <TextField {...props} />;
}

/**
 * Renders a labelled form field. See `input.stories.tsx` for the full
 * type matrix (text / number / date / select / email / phone / password
 * / decimal) and the canonical label-with-note surface designers
 * review.
 */
export function Input(props: InputProps): ReactElement {
  const type: InputType = props.type ?? 'text';

  return (
    <View testID={props.testID ?? 'input'} marginBottom={ROW_MARGIN_BOTTOM}>
      {props.label !== undefined && <InputLabel text={props.label} />}
      <InputField
        type={type}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        options={props.options}
        ariaLabel={props.ariaLabel ?? props.label}
        label={props.label}
        returnKeyType={props.returnKeyType}
        onSubmitEditing={props.onSubmitEditing}
        blurOnSubmit={props.blurOnSubmit}
        autoComplete={props.autoComplete}
        inputRef={props.inputRef}
        onBlur={props.onBlur}
      />
      {props.note !== undefined && <InputNote text={props.note} />}
    </View>
  );
}
