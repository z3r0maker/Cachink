'use client';

import * as f from './field.css';

/** A row of mutually exclusive chips (motivo, categoría); 42 px or 40 px in the files. */
export function ChoiceChips<T extends string>(p: {
  readonly label: string;
  readonly options: readonly T[];
  readonly value: T | null;
  readonly onChange: (v: T) => void;
  readonly height?: 40 | 42;
}) {
  return (
    <div>
      <div className={f.label} style={{ marginBottom: 8 }}>
        {p.label}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {p.options.map((o) => (
          <button
            key={o}
            type="button"
            className={f.choice}
            style={{ height: p.height ?? 42 }}
            aria-pressed={p.value === o}
            onClick={() => p.onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
