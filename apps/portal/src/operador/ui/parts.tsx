import { colors } from '@xangarro/tokens';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';

import { Icon } from '../../shell/icon';
import * as u from './ui.css';

/**
 * The screen's `<main>` and its column: 1760 px on list screens, 1100 on the
 * reading screens (Avisos, Pendientes, details). `top` is the file's top padding.
 */
export function OpMain({
  top,
  narrow = false,
  children,
}: {
  readonly top: 22 | 24;
  readonly narrow?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <main className={`${u.main[top === 22 ? 'top22' : 'top24']} ${u.mainPhone}`}>
      <div className={u.stack} style={narrow ? { maxWidth: 1100 } : undefined}>
        {children}
      </div>
    </main>
  );
}

export interface KpiItem {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  /** A CSS colour for the figure — always a token (`var(--…)` or `colors.*`). */
  readonly color: string;
  readonly bg?: string;
}

/** KPI cards on an auto-fit grid; sizes differ per screen, so they are props. */
export function KpiRow({
  items,
  min,
  valueSize,
}: {
  readonly items: readonly KpiItem[];
  readonly min: number;
  readonly valueSize: number;
}) {
  const grid: CSSProperties = { gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` };
  return (
    <div className={u.kpiGrid} style={grid}>
      {items.map((k) => (
        <div key={k.label} className={u.kpi} style={{ background: k.bg ?? colors.white }}>
          <div className={u.eyebrow}>{k.label}</div>
          <div className={u.kpiValue} style={{ fontSize: valueSize, color: k.color }}>
            {k.value}
          </div>
          <div className={u.kpiHint}>{k.hint}</div>
        </div>
      ))}
    </div>
  );
}

/** A list card: the tinted head (label · count · note · link) above its rows. */
export function ListCard({
  label,
  headBg,
  count,
  note,
  link,
  children,
}: {
  readonly label: string;
  readonly headBg: string;
  readonly count?: number;
  readonly note?: string;
  readonly link?: { readonly label: string; readonly href: string };
  readonly children: ReactNode;
}) {
  return (
    <section className={u.listCard}>
      <div className={u.listHead} style={{ background: headBg }}>
        <span className={u.eyebrow}>{label}</span>
        {count === undefined ? null : <span className={u.countPill}>{count}</span>}
        {note ? <span className={u.headNote}>{note}</span> : null}
        {link ? (
          <Link href={link.href} className={u.headLink}>
            {link.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** The tinted square that carries a row's glyph (40 px, 11 radius in the files). */
export function TintBox({
  icon,
  tint,
  size,
  glyph,
  stroke = 2.4,
}: {
  readonly icon: string;
  readonly tint: string;
  readonly size: number;
  readonly glyph: number;
  readonly stroke?: number;
}) {
  return (
    <span className={u.tintBox} style={{ width: size, height: size, background: tint }}>
      <Icon path={icon} size={glyph} strokeWidth={stroke} />
    </span>
  );
}
