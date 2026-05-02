/**
 * Cross-platform building blocks shared by `input.tsx` (web) and
 * `input.native.tsx` (RN). The `<Input>` wrapper itself stays in each
 * platform variant because the SelectField branch differs — but the
 * label, note, text field, and styling tokens are identical on both
 * targets and live here so we honour CLAUDE.md §2 ("Code lives in
 * exactly one place").
 *
 * Vite-based tools resolve `./input.tsx`; Metro auto-picks
 * `./input.native.tsx`. Both import from this file directly.
 *
 * ## Audit PR 2 — Keyboard-hint variants
 *
 * The original `InputType` union was `'text' | 'number' | 'date' | 'select'`.
 * That union is too narrow to express the platform keyboard / autofill
 * hints mobile users need (audit findings 1.1, 1.2, 1.5, 1.6). The union
 * now includes `'email' | 'phone' | 'password' | 'decimal'`. Existing
 * callers continue to work because we only ADDED variants — none were
 * renamed or removed.
 *
 * Each variant is mapped to the right combination of:
 *   - `keyboardType` (RN — controls the soft keyboard)
 *   - `inputMode` (web — same purpose, accepted by HTMLInputElement)
 *   - `secureTextEntry` (RN, `type=password` on web) — masks the input
 *   - `autoCapitalize` — `'none'` for emails, `'sentences'` default
 *   - `autoComplete` — drives platform autofill (email, password, etc.)
 *   - `returnKeyType` — controls the on-screen "go" button label
 *
 * A `data-input-type` HTML attribute is rendered on the underlying field
 * so platform tests can assert the right keyboard hints flowed through
 * without coupling to `keyboardType` (which Tamagui may not serialize
 * to the DOM on web).
 */
import type { CSSProperties, ReactElement, RefObject } from 'react';
import { Text } from '@tamagui/core';
import { Input as TamaguiInput } from '@tamagui/input';
import { colors, radii, typography } from '../../theme';

/**
 * The full set of input variants supported by the `<Input>` primitive.
 *
 * ⚠️ Adding a variant? You must:
 *   1. Decide what `keyboardType`/`inputMode`/`autoCapitalize`/
 *      `autoComplete`/`secureTextEntry` it implies (see `keyboardHintsFor`).
 *   2. Add a story under `input.stories.tsx`.
 *   3. Add a regression test under `tests/input.test.tsx`.
 */
export type InputType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'email'
  | 'phone'
  | 'password'
  | 'decimal';

export const FIELD_RADIUS = radii[2]; // 12 — per CLAUDE.md §8.3 scale.
export const ROW_MARGIN_BOTTOM = 14; // form-row rhythm from the mock.
export const LABEL_MARGIN_BOTTOM = 5;
export const NOTE_MARGIN_TOP = 3;

/**
 * Shared visual tokens for the web `<select>` styling. Native variant
 * doesn't use this — it builds its trigger row out of `<View>` + `<Text>`
 * with Tamagui props directly.
 */
export const FIELD_STYLE: CSSProperties = {
  borderColor: colors.black,
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: FIELD_RADIUS,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: 15,
  fontWeight: typography.weights.medium,
  color: colors.ink,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

/**
 * Resolved keyboard / autofill / masking hints for an input variant.
 * Computed once via `keyboardHintsFor(type)` and then spread onto the
 * underlying Tamagui `<Input>` so each platform receives only the props
 * it understands.
 */
export interface KeyboardHints {
  /** RN `keyboardType` — soft keyboard variant. */
  readonly keyboardType?:
    | 'default'
    | 'numeric'
    | 'decimal-pad'
    | 'number-pad'
    | 'email-address'
    | 'phone-pad';
  /** Web `inputMode` — equivalent of `keyboardType` on HTMLInputElement. */
  readonly inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'none';
  /** Whether the field should mask its value (passwords). */
  readonly secureTextEntry?: boolean;
  /** Auto-capitalisation strategy. Defaults to `'sentences'`. */
  readonly autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Browser/OS autofill / autocomplete identifier. */
  readonly autoComplete?: string;
  /** Disable autocorrect (emails, phone numbers, etc.). */
  readonly autoCorrect?: boolean;
  /** Underlying HTML input type for the web target. */
  readonly htmlType: string;
}

/**
 * Static lookup of the keyboard / autofill / masking hints per variant.
 *
 * Deliberately a const map (not a switch) so adding a variant only
 * requires one new entry. The `number` entry uses `htmlType: 'text'`
 * because HTML `<input type="number">` rejects non-digit keystrokes
 * via its `value` getter (returns `""` when the buffer isn't a valid
 * number), which makes the controlled-input pattern misbehave for our
 * `<IntegerField>` (we strip non-digits ourselves and re-render). The
 * `inputMode` + `keyboardType` combo still surfaces the numeric
 * keyboard on both platforms.
 */
const KEYBOARD_HINTS: Record<InputType, KeyboardHints> = {
  email: {
    keyboardType: 'email-address',
    inputMode: 'email',
    autoCapitalize: 'none',
    autoComplete: 'email',
    autoCorrect: false,
    htmlType: 'email',
  },
  phone: {
    keyboardType: 'phone-pad',
    inputMode: 'tel',
    autoCapitalize: 'none',
    autoComplete: 'tel',
    autoCorrect: false,
    htmlType: 'tel',
  },
  password: {
    keyboardType: 'default',
    inputMode: 'text',
    secureTextEntry: true,
    autoCapitalize: 'none',
    autoComplete: 'current-password',
    autoCorrect: false,
    htmlType: 'password',
  },
  decimal: {
    keyboardType: 'decimal-pad',
    inputMode: 'decimal',
    autoCapitalize: 'none',
    autoCorrect: false,
    htmlType: 'text',
  },
  number: {
    keyboardType: 'number-pad',
    inputMode: 'numeric',
    autoCapitalize: 'none',
    autoCorrect: false,
    htmlType: 'text',
  },
  date: { autoCapitalize: 'none', autoCorrect: false, htmlType: 'date' },
  select: { htmlType: 'text' },
  text: { htmlType: 'text' },
};

/**
 * Resolve the platform keyboard / autofill / masking hints for a given
 * variant. Pure function — every behaviour difference between variants
 * lives in `KEYBOARD_HINTS` above.
 */
export function keyboardHintsFor(type: InputType): KeyboardHints {
  return KEYBOARD_HINTS[type];
}

/** Props consumed by every concrete field variant (text/number/date/select/etc.). */
export interface FieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly options?: readonly string[];
  readonly type: InputType;
  readonly ariaLabel?: string;
  /**
   * `'next'` advances focus to the next field on Enter; `'done'` shows
   * the iOS "Listo" cap and submits the form on Enter. Default is
   * `'default'` (RN's regular Return key).
   */
  readonly returnKeyType?: 'default' | 'next' | 'done' | 'go' | 'send' | 'search';
  /** Called when the user taps Return / Enter on the soft keyboard. */
  readonly onSubmitEditing?: () => void;
  /**
   * `false` keeps focus on the current field after Enter (used for
   * intermediate fields). Default `true` mirrors RN's default.
   */
  readonly blurOnSubmit?: boolean;
  /**
   * Override the `autoComplete` token. `<PasswordField>` uses this to
   * switch between `'current-password'` (sign-in) and `'new-password'`
   * (sign-up).
   */
  readonly autoComplete?: string;
  /** Imperative ref to the underlying TextInput (focus / blur control). */
  readonly inputRef?: RefObject<unknown>;
  /** Fires on focus loss — used by `<MoneyField>` to format on blur. */
  readonly onBlur?: () => void;
  /**
   * Override the default left padding (14). Used by `<SearchBar>` to
   * clear the leading search icon.
   */
  readonly paddingLeft?: number;
}

export function InputLabel({ text }: { text: string }): ReactElement {
  return (
    <Text
      color={colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={12}
      letterSpacing={typography.letterSpacing.wide}
      marginBottom={LABEL_MARGIN_BOTTOM}
      style={{ textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

export function InputNote({ text }: { text: string }): ReactElement {
  return (
    <Text
      color={colors.gray400}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={11}
      marginTop={NOTE_MARGIN_TOP}
    >
      {text}
    </Text>
  );
}

/**
 * Brand visual styling tokens for the underlying TamaguiInput. Frozen
 * `as const` so a new field variant can spread them verbatim instead
 * of duplicating the §8 brand values inline.
 */
const FIELD_VISUAL = {
  borderColor: colors.black,
  borderWidth: 2,
  focusStyle: { borderWidth: 2.5, borderColor: colors.black },
  borderRadius: FIELD_RADIUS,
  paddingHorizontal: 14,
  paddingVertical: 11,
  fontSize: 15,
  fontWeight: typography.weights.medium,
  color: colors.ink,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  style: { outlineWidth: 0, boxShadow: 'none', borderStyle: 'solid' as const },
} as const;

/**
 * Tamagui cross-platform `<Input>` for every text-style variant
 * (text / number / date / email / phone / password / decimal). The
 * `select` branch is handled separately at the wrapper layer because it
 * delegates to `<Combobox>` instead of an HTML/RN input.
 *
 * The `data-input-type` attribute exposes the resolved variant to the
 * DOM so tests can assert the right keyboard hint flowed through
 * without coupling to RN-only props that Tamagui may not serialize.
 */
export function TextField(props: FieldProps): ReactElement {
  const hints = keyboardHintsFor(props.type);
  const resolvedAutoComplete = props.autoComplete ?? hints.autoComplete;
  return (
    <TamaguiInput
      value={props.value}
      onChangeText={props.onChange}
      placeholder={props.placeholder}
      aria-label={props.ariaLabel}
      type={hints.htmlType}
      keyboardType={hints.keyboardType}
      secureTextEntry={hints.secureTextEntry}
      autoCapitalize={hints.autoCapitalize}
      autoCorrect={hints.autoCorrect}
      autoComplete={resolvedAutoComplete}
      returnKeyType={props.returnKeyType}
      onSubmitEditing={props.onSubmitEditing}
      blurOnSubmit={props.blurOnSubmit}
      onBlur={props.onBlur}
      inputMode={hints.inputMode}
      data-input-type={props.type}
      placeholderTextColor="$gray400"
      {...FIELD_VISUAL}
      {...(props.paddingLeft !== undefined ? { paddingLeft: props.paddingLeft } : {})}
    />
  );
}
