'use client';

import { startTransition, useId, type FormEvent } from 'react';

import * as d from '@/styles/mostrador-data.css';

/**
 * Option cards (CLAUDE.md §6: ≤ 5 choices are cards, not a dropdown). Plain
 * radios underneath, so the form posts without script and the keyboard works.
 */
export interface Opcion {
  readonly value: string;
  readonly title: string;
  readonly text?: string;
}

export function Opciones({
  legend,
  name,
  opciones,
  value,
  onChange,
}: {
  readonly legend: string;
  readonly name: string;
  readonly opciones: readonly Opcion[];
  readonly value: string;
  readonly onChange?: (value: string) => void;
}) {
  return (
    <fieldset className={d.fieldset}>
      <legend className={d.legend}>{legend}</legend>
      <div className={d.options}>
        {opciones.map((o) => (
          <label key={o.value} className={d.option}>
            <input
              className={d.optionInput}
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={o.value === value}
              onChange={() => onChange?.(o.value)}
            />
            <span className={d.optionTitle}>{o.title}</span>
            {o.text === undefined ? null : <span className={d.optionText}>{o.text}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Submits through the action without `<form action>`: React resets a form
 * after its action runs, even when the action answered with an error, and a
 * founder should not retype a whole expense because one figure was wrong.
 */
export function submitWith(action: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  };
}

export function Campo({
  label,
  name,
  hint,
  ...input
}: {
  readonly label: string;
  readonly name: string;
  readonly hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={d.field}>
      <label className={d.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={d.input}
        name={name}
        aria-describedby={hint === undefined ? undefined : `${id}-hint`}
        {...input}
      />
      {hint === undefined ? null : (
        <span id={`${id}-hint`} className={d.hint} aria-live="polite">
          {hint}
        </span>
      )}
    </div>
  );
}
