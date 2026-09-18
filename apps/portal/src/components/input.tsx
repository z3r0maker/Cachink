import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

import { errorText, field, fieldGroup, hint, label, money } from './input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** Always required: placeholder-only labelling fails the accessibility pass. */
  readonly labelText: string;
  readonly hintText?: string;
  readonly error?: string;
  /** Right-aligns with tabular numerals, for money and counts. */
  readonly numeric?: boolean;
}

export function Input({ labelText, hintText, error, numeric, id, ...rest }: InputProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const describedBy = error ? `${inputId}-error` : hintText ? `${inputId}-hint` : undefined;

  return (
    <div className={fieldGroup}>
      <label className={label} htmlFor={inputId}>
        {labelText}
      </label>
      <input
        id={inputId}
        className={numeric ? `${field} ${money}` : field}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className={errorText}>
          {error}
        </p>
      ) : hintText ? (
        <p id={`${inputId}-hint`} className={hint}>
          {hintText}
        </p>
      ) : null}
    </div>
  );
}
