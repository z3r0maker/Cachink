/**
 * Input — mobile (React Native) variant.
 *
 * Mirrors `./input.tsx` and shares every branch with it (CLAUDE.md §2 —
 * code lives in exactly one place). The select branch now delegates to
 * the shared `<Combobox>` primitive, which uses an anchored Tamagui
 * Popover and renders the same way on web and native — replacing the
 * previous bottom-sheet `<Modal>` flow that pinned the picker to the
 * viewport edge regardless of where the trigger lived.
 *
 * Metro auto-picks this file on iOS/Android via React Native's
 * `.native.tsx` resolution. Vite-based tools (Vitest, Storybook,
 * Tauri) resolve `./input.tsx` and never load this file. The split is
 * preserved for symmetry with the rest of the platform-extension
 * pattern even though the implementation is now identical (the new
 * `keyboardType` / `secureTextEntry` props live in `<TextField>` and
 * apply uniformly on RN — the web build silently ignores them).
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
   * `email` / `phone` / `password` / `decimal` pass through to
   * Tamagui's cross-platform `<Input>` primitive; `select` (or passing
   * `options`) delegates to `<Combobox>` — same anchored popover the
   * web variant renders.
   */
  readonly type?: InputType;
  readonly placeholder?: string;
  /** When present, renders a Combobox with one option per entry. */
  readonly options?: readonly string[];
  /** Small muted help text rendered below the field. Optional. */
  readonly note?: string;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
  /** Explicit screen-reader label. Defaults to `label` when both are present. */
  readonly ariaLabel?: string;
  /** Soft-keyboard return-key hint. */
  readonly returnKeyType?: 'default' | 'next' | 'done' | 'go' | 'send' | 'search';
  /** Called when the user taps Return / Enter. */
  readonly onSubmitEditing?: () => void;
  /** `false` keeps focus on this field after Enter (intermediate fields). */
  readonly blurOnSubmit?: boolean;
  /** Override the platform autofill token. */
  readonly autoComplete?: string;
  /** Imperative ref to the underlying TextInput. */
  readonly inputRef?: RefObject<unknown>;
  /** Fires on focus loss. */
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
 * here — same rationale as `./input.tsx` (testID stays on the outer
 * View; trigger uses Combobox's default `combobox-trigger` handle).
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
 * Renders a labelled form field. Same public API as the web variant
 * (`./input.tsx`); both delegate to the cross-platform `<Combobox>`
 * for the select branch.
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
