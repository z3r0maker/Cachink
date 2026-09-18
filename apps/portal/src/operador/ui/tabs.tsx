import * as t from './tabs.css';

/** Avisos spaces its tabs 10 px with 9 px pills; Inventario 9 and 8. */
const DENSITY = { avisos: { gap: 10, pad: 9 }, inventario: { gap: 9, pad: 8 } } as const;

export function SegTabs<K extends string>(p: {
  readonly items: readonly (readonly [K, string, number])[];
  readonly value: K;
  readonly onChange: (k: K) => void;
  readonly density: keyof typeof DENSITY;
}) {
  const d = DENSITY[p.density];
  return (
    <div className={t.tabs} role="tablist">
      {p.items.map(([key, label, n]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={p.value === key}
          className={t.tab}
          style={{ gap: d.gap }}
          onClick={() => p.onChange(key)}
        >
          {label}
          <span className={t.count} style={{ padding: `1px ${d.pad}px` }}>
            {n}
          </span>
        </button>
      ))}
    </div>
  );
}
