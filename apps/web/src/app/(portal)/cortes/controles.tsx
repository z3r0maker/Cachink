'use client';

import { Icon } from '@/shell/icon';

import * as s from './controles.css';

const LUPA = 'm21 21-4.34-4.34M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0';

export interface PestanaDef<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
}

/**
 * The white tab row with the active tab in yellow. A group of pressed buttons,
 * like `SegmentedTabs`: it switches the view, it does not reveal a panel.
 */
export function Pestanas<T extends string>(p: {
  readonly ariaLabel: string;
  readonly tabs: readonly PestanaDef<T>[];
  readonly value: T;
  readonly onChange: (v: T) => void;
}) {
  return (
    <div className={s.pestanas} role="group" aria-label={p.ariaLabel}>
      {p.tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          className={s.pestana}
          aria-pressed={t.value === p.value}
          onClick={() => p.onChange(t.value)}
        >
          {t.label}
          {t.count === undefined ? null : ' '}
          {t.count === undefined ? null : <span className={s.cuenta}>{`· ${t.count}`}</span>}
        </button>
      ))}
    </div>
  );
}

/** A toggle beside the tabs: black with yellow text while it is on. */
export function Palanca(p: {
  readonly label: string;
  readonly on: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button type="button" className={s.palanca} aria-pressed={p.on} onClick={p.onClick}>
      {p.label}
    </button>
  );
}

export function Separador() {
  return <span className={s.separador} aria-hidden="true" />;
}

export function Buscador(p: {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <label className={s.buscar}>
      <Icon path={LUPA} size={18} strokeWidth={2} />
      <input
        type="search"
        aria-label={p.label}
        placeholder={p.placeholder}
        className={s.buscarInput}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
      />
    </label>
  );
}

export { barra } from './controles.css';
