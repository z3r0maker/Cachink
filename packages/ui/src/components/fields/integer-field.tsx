/**
 * `<IntegerField>` — labelled non-negative integer input.
 *
 * Closes audit finding 1.7: 4 quantity / integer inputs accepted floats
 * and out-of-range values until submit. This primitive strips
 * non-digits at the input layer and clamps to the optional `min`/`max`
 * bounds on blur, so the user never sees an invalid value persist.
 *
 * Use cases: cantidad de inventario, días promedio, número de
 * empleados, cantidad de unidades.
 */
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { Input } from '../Input/input';

export interface IntegerFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Inclusive lower bound. Negative values are dropped at the input layer. */
  readonly min?: number;
  /** Inclusive upper bound. */
  readonly max?: number;
  readonly label?: string;
  readonly placeholder?: string;
  readonly note?: string;
  readonly testID?: string;
  readonly ariaLabel?: string;
  readonly returnKeyType?: 'default' | 'next' | 'done' | 'go' | 'send' | 'search';
  readonly onSubmitEditing?: () => void;
  readonly blurOnSubmit?: boolean;
}

function clean(raw: string): string {
  // Strip everything that isn't a digit. Negative inputs are rejected
  // — pass `min={Number.NEGATIVE_INFINITY}` is not allowed, callers
  // who need negatives use `<TextField>` with custom validation.
  return raw.replace(/\D+/g, '');
}

export function IntegerField(props: IntegerFieldProps): ReactElement {
  const { onChange, min, max } = props;

  const handleChange = useCallback(
    (raw: string): void => {
      const cleaned = clean(raw);
      onChange(cleaned);
    },
    [onChange],
  );

  const handleBlur = useCallback((): void => {
    if (props.value === '') return;
    const n = Number.parseInt(props.value, 10);
    if (Number.isNaN(n)) return;
    let clamped = n;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    if (clamped !== n) onChange(String(clamped));
  }, [props.value, onChange, min, max]);

  return (
    <Input
      type="number"
      value={props.value}
      onChange={handleChange}
      onBlur={handleBlur}
      label={props.label}
      placeholder={props.placeholder ?? '0'}
      note={props.note}
      testID={props.testID ?? 'integer-field'}
      ariaLabel={props.ariaLabel ?? props.label}
      returnKeyType={props.returnKeyType}
      onSubmitEditing={props.onSubmitEditing}
      blurOnSubmit={props.blurOnSubmit}
    />
  );
}
