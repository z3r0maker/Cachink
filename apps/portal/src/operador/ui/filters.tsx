'use client';

import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as f from './filters.css';

const SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3';

export function SearchBox(p: {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  /** 240 px in most files; Inventario's shares its row with tabs and buttons (220). */
  readonly minWidth?: 220 | 240;
}) {
  return (
    <div className={f.search} style={p.minWidth ? { minWidth: p.minWidth } : undefined}>
      <span style={{ color: colors.gray600, display: 'grid' }}>
        <Icon path={SEARCH} size={18} strokeWidth={2.4} />
      </span>
      <input
        type="search"
        aria-label={p.label}
        placeholder={p.placeholder}
        className={f.input}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
      />
    </div>
  );
}

export function FilterChips<T extends string>(p: {
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (v: T) => void;
}) {
  return (
    <div className={f.chips}>
      {p.options.map((o) => (
        <button
          key={o}
          type="button"
          className={f.chip}
          aria-pressed={p.value === o}
          onClick={() => p.onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** «Sin resultados»: inside the list card, when the filters leave nothing. */
export function SinResultados({ body }: { readonly body: string }) {
  return (
    <div className={f.none}>
      <div className={f.noneTile}>
        <Icon path={SEARCH} size={26} strokeWidth={2.3} />
      </div>
      <div className={f.noneTitle}>Sin resultados</div>
      <div className={f.noneBody}>{body}</div>
    </div>
  );
}
