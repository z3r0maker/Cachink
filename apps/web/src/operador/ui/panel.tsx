import type { ReactNode } from 'react';
import { shapeRadii } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as p from './panel.css';
import * as st from './stat.css';

/** «Mi turno  Ana Robledo, Caja 1…»: the h1 and its gray subtitle on one baseline. */
export function PageHead({
  title,
  sub,
  children,
}: {
  readonly title: string;
  readonly sub?: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <div className={p.pageHead}>
      <h1 className={p.pageTitle}>{title}</h1>
      {sub ? <span className={p.pageSub}>{sub}</span> : null}
      {children}
    </div>
  );
}

/** A quiet panel: gray edge, an eyebrow head (count · note · action), then its rows. */
export function Panel({
  label,
  count,
  note,
  action,
  className,
  children,
}: {
  readonly label: string;
  readonly count?: number;
  readonly note?: string;
  readonly action?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <section aria-label={label} className={className ? `${p.panel} ${className}` : p.panel}>
      <div className={p.panelHead}>
        <span className={p.eyebrow}>{label}</span>
        {count === undefined ? null : <span className={p.count}>{count}</span>}
        {note ? <span className={p.panelNote}>{note}</span> : null}
        {action}
      </div>
      {children}
    </section>
  );
}

export interface StatItem {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  /** A token colour for the figure. */
  readonly color: string;
  /** The one figure to act on: soft yellow with a black edge. */
  readonly strong?: boolean;
}

/** The figures on a grid; `grid` swaps the default auto-fit columns for the screen's own. */
export function StatRow({
  items,
  grid,
}: {
  readonly items: readonly StatItem[];
  readonly grid?: string;
}) {
  return (
    <div className={grid ?? st.statGrid}>
      {items.map((k) => (
        <div key={k.label} className={k.strong ? `${st.stat} ${st.statStrong}` : st.stat}>
          <span className={p.eyebrow}>{k.label}</span>
          <span className={st.statValue} style={{ color: k.color }}>
            {k.value}
          </span>
          <span className={st.statHint}>{k.hint}</span>
        </div>
      ))}
    </div>
  );
}

/** A row's glyph in its tinted, black-edged square. */
export function Tile({
  icon,
  tint,
  size = 44,
  glyph = 20,
}: {
  readonly icon: string;
  readonly tint: string;
  readonly size?: number;
  readonly glyph?: number;
}) {
  return (
    <span className={p.tile} style={{ width: size, height: size, background: tint }}>
      <Icon path={icon} size={glyph} strokeWidth={2} />
    </span>
  );
}

/** A status chip; `color` paints the text and the edge, `bg` the fill. */
export function Chip({
  label,
  color,
  bg,
  dot,
}: {
  readonly label: string;
  readonly color: string;
  readonly bg: string;
  readonly dot?: string;
}) {
  return (
    <span className={p.chip} style={{ color, background: bg, borderColor: color }}>
      {dot ? <span aria-hidden="true" style={dotStyle(dot)} /> : null}
      {label}
    </span>
  );
}

const dotStyle = (bg: string) => ({
  width: 7,
  height: 7,
  borderRadius: shapeRadii.pill,
  background: bg,
});
