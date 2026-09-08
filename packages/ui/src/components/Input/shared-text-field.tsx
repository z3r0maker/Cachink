/**
 * TextField — Tamagui cross-platform text-style input.
 *
 * Extracted from `input-shared.tsx` to keep that file under the 200-line
 * budget. Handles every text-style variant (text/number/date/email/phone/
 * password/decimal). The `select` branch is wired at the Input wrapper
 * layer which delegates to `<Combobox>` instead.
 */
import type { ReactElement } from 'react';
import { Input as TamaguiInput } from '@tamagui/input';
import { colors, fontSizes, radii, typography } from '../../theme';
import type { FieldProps } from './input-shared';
import { keyboardHintsFor } from './input-shared';

const FIELD_RADIUS = radii[2]; // 12 — same as input-shared.ts

/** Brand visual styling tokens for the underlying TamaguiInput. */
const FIELD_VISUAL = {
  borderColor: colors.black,
  borderWidth: 2,
  focusStyle: { borderWidth: 2.5, borderColor: colors.black },
  borderRadius: FIELD_RADIUS,
  paddingHorizontal: 14,
  paddingVertical: 11,
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.medium,
  color: colors.ink,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  style: { outlineWidth: 0, boxShadow: 'none', borderStyle: 'solid' as const },
} as const;

/** Prevent iOS Strong Password autofill when autoComplete="off". */
function autofillOverride(autoComplete: string | undefined) {
  return autoComplete === 'off'
    ? { textContentType: 'oneTimeCode' as const, autoComplete: 'one-time-code' as const }
    : {};
}

export function TextField(props: FieldProps): ReactElement {
  const hints = keyboardHintsFor(props.type);
  const resolvedAutoComplete = props.autoComplete ?? hints.autoComplete;
  const paddingOverride = props.paddingLeft !== undefined ? { paddingLeft: props.paddingLeft } : {};
  const borderOverride =
    props.borderColor !== undefined
      ? {
          borderColor: props.borderColor,
          focusStyle: { borderWidth: 2.5, borderColor: props.borderColor },
        }
      : {};
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
      onFocus={props.onFocus}
      inputMode={hints.inputMode}
      data-input-type={props.type}
      placeholderTextColor="$placeholderColor"
      ref={props.inputRef as never}
      {...FIELD_VISUAL}
      {...autofillOverride(resolvedAutoComplete)}
      {...paddingOverride}
      {...borderOverride}
    />
  );
}
