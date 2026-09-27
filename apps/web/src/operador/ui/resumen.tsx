import { Icon } from '../../shell/icon';
import * as r from './resumen.css';

const SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3';

export interface Resumen {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  /** A token colour for the figure. */
  readonly color: string;
}

/** The quiet KPI row under the page title (El Mostrador). */
export function Resumenes({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly Resumen[];
}) {
  return (
    <section aria-label={label} className={r.kpis}>
      {items.map((k) => (
        <div key={k.label} className={r.kpi}>
          <span className={r.eyebrow}>{k.label}</span>
          <span className={r.kpiValue} style={{ color: k.color }}>
            {k.value}
          </span>
          <span className={r.kpiHint}>{k.hint}</span>
        </div>
      ))}
    </section>
  );
}

/** The quiet search field of the list screens. */
export function Buscador(p: {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <label className={r.search}>
      <Icon path={SEARCH} size={18} strokeWidth={2} />
      <input
        type="search"
        aria-label={p.label}
        placeholder={p.placeholder}
        className={r.searchInput}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
      />
    </label>
  );
}

/** The list screens' filter pills («Todos», «Con saldo», «Atrasados»). */
export function Filtros<T extends string>(p: {
  readonly label: string;
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={p.label} className={r.filtros}>
      {p.options.map((o) => (
        <button
          key={o}
          type="button"
          className={r.filtro}
          aria-pressed={p.value === o}
          onClick={() => p.onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
