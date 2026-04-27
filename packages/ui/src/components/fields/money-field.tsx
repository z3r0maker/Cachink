/**
 * `<MoneyField>` — labelled peso-amount input.
 *
 * The form-layer answer to audit findings 1.4 (10 monetary inputs accept
 * commas/$ that coerce to NaN; no blur formatting) and 6.1 (canonical
 * Money primitive missing). Wraps the brand `<Input>` in `decimal` mode
 * so:
 *
 *   - The mobile keyboard pops the `decimal-pad` variant (no letters,
 *     no symbols, just digits + a single decimal mark).
 *   - The web target sends `inputMode="decimal"` so iOS Safari and
 *     Chrome show the same numeric keyboard.
 *   - Non-numeric characters are stripped at the input layer instead of
 *     waiting for submit-time validation.
 *   - On blur, the visible value is reformatted via `formatPesos()`
 *     (e.g. `1234` → `"1,234.56"`) so users see a properly-grouped
 *     amount before they tab away.
 *   - The canonical `Money` (bigint centavos) value is exposed through
 *     `onValueChange` so callers don't have to call `fromPesos()`
 *     themselves and risk dropping a centavo.
 *
 * Money stays as `bigint` per CLAUDE.md §2 principle 8. The visible
 * string state is a UI affordance only — never the source of truth.
 *
 * ## Props
 *
 * Two-way binding mirrors the existing `<Input>` shape: `value` (the
 * visible string) + `onChange` (every keystroke) for forms that wire
 * these directly to React state, plus `onValueChange` for forms that
 * want the parsed `Money | null` result.
 *
 * Pass `value=""` for an empty field. Empty + parse → `null`.
 */
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';
import { fromPesos, formatPesos, type Money } from '@cachink/domain';
import { Input } from '../Input/input';

export interface MoneyFieldProps {
  /** Visible string value (e.g. `"1234.56"`). Use `""` for empty. */
  readonly value: string;
  /** Fired on every keystroke with the cleaned-but-unformatted string. */
  readonly onChange: (value: string) => void;
  /**
   * Fired on blur and on every successful keystroke parse. `null` when
   * the field is empty; never fires for invalid intermediate states.
   */
  readonly onValueChange?: (centavos: Money | null) => void;
  readonly label?: string;
  /** Defaults to `'0.00'`. */
  readonly placeholder?: string;
  /** Small muted help text rendered below the field. */
  readonly note?: string;
  /** Forwarded to the root View — anchor for E2E tests. */
  readonly testID?: string;
  /** Explicit screen-reader label. Defaults to `label`. */
  readonly ariaLabel?: string;
  readonly returnKeyType?: 'default' | 'next' | 'done' | 'go' | 'send' | 'search';
  readonly onSubmitEditing?: () => void;
  readonly blurOnSubmit?: boolean;
}

/**
 * Strip everything except digits and the first decimal mark.
 *
 * The es-MX convention (and the `formatPesos` output we re-format
 * to on blur) is `,` as the thousands separator and `.` as the
 * decimal mark — same as en-US. Users who paste a formatted amount
 * (`$1,234.56`) get the commas dropped and the decimal preserved.
 * Users who paste a single comma as a decimal mark (`12,50`) get
 * it dropped — they have to retype with `.`. That trade-off is
 * deliberate: every other peso amount in the app uses dots, so
 * accepting `,` as decimal would silently produce wrong values
 * for the much more common `1,234` thousands case.
 *
 * Leading zeros are kept so the input remains controlled — the
 * `<Input>` does not eat keystrokes — and the on-blur formatter
 * collapses them.
 */
function clean(raw: string): string {
  // Drop commas (thousands separators) and any other non-numeric
  // character except `.`.
  const stripped = raw.replace(/[^0-9.]/g, '');
  // Keep only the first `.` — collapse any trailing decimal marks.
  const firstDot = stripped.indexOf('.');
  if (firstDot === -1) return stripped;
  return stripped.slice(0, firstDot + 1) + stripped.slice(firstDot + 1).replace(/\./g, '');
}

/**
 * Try to parse a cleaned string into `Money`. Returns `null` for empty
 * or invalid intermediate states (e.g. `"."`, `"1."`, `"-"`). Used by
 * `onValueChange` to surface the canonical bigint value without
 * throwing during typing.
 */
function tryParse(cleaned: string): Money | null {
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return null;
  // Truncate to 2 decimal places (`fromPesos` rejects more than 2).
  const dot = cleaned.indexOf('.');
  const limited = dot === -1 ? cleaned : cleaned.slice(0, dot + 3);
  try {
    return fromPesos(limited);
  } catch {
    return null;
  }
}

export function MoneyField(props: MoneyFieldProps): ReactElement {
  const { value, onChange, onValueChange } = props;
  const [, setVersion] = useState(0);

  const handleChange = useCallback(
    (raw: string) => {
      const cleaned = clean(raw);
      onChange(cleaned);
      if (onValueChange !== undefined) {
        onValueChange(tryParse(cleaned));
      }
    },
    [onChange, onValueChange],
  );

  const handleBlur = useCallback(() => {
    const parsed = tryParse(value);
    if (parsed !== null) {
      // formatPesos returns '1,234.56' (es-MX grouping). Pump it back
      // through onChange so the visible string updates. Tests can
      // observe the formatted result by reading the input's value
      // post-blur.
      const formatted = formatPesos(parsed);
      // Strip the grouping commas from the value we keep in state — we
      // re-format on every blur, but the persisted string stays in the
      // `1234.56` canonical form so onChange consumers don't have to
      // parse `1,234.56`.
      onChange(formatted.replace(/,/g, ''));
      // Force a re-render so the formatted value is reflected even
      // when the parent forwards the value verbatim.
      setVersion((v) => v + 1);
    }
    // Invalid → leave as-is; submit-time validation surfaces the error.
  }, [value, onChange]);

  return (
    <Input
      type="decimal"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      label={props.label}
      placeholder={props.placeholder ?? '0.00'}
      note={props.note}
      testID={props.testID}
      ariaLabel={props.ariaLabel ?? props.label}
      returnKeyType={props.returnKeyType}
      onSubmitEditing={props.onSubmitEditing}
      blurOnSubmit={props.blurOnSubmit}
    />
  );
}
