'use client';

import { formatMoney, type Money } from '@xangarro/domain';
import { useState } from 'react';

import { Card } from '@/components';

import {
  disclosure,
  line,
  lineAmount,
  lineLabel,
  lineSubtitle,
  lineTotal,
  subLine,
} from './estados.css';

export interface StatementLine {
  readonly label: string;
  readonly subtitle?: string;
  readonly amount: Money;
  readonly total?: boolean;
  /** Renders in parentheses — a subtraction in the statement's arithmetic. */
  readonly negative?: boolean;
  /** What the line is made of; present → the line has a disclosure toggle. */
  readonly detalle?: readonly { readonly label: string; readonly amount: Money }[];
}

const monto = (l: { amount: Money }, negative?: boolean) =>
  negative ? `(${formatMoney(l.amount)})` : formatMoney(l.amount);

/**
 * One statement line. With a breakdown it gets the 23×23 disclosure toggle
 * (`aria-expanded`), and expanding lists what it is made of — the parts add
 * up to the line, a domain test holds that.
 */
function Linea({ l }: { readonly l: StatementLine }) {
  const [open, setOpen] = useState(false);
  const expandable = (l.detalle?.length ?? 0) > 0;
  return (
    <>
      <div className={l.total ? `${line} ${lineTotal}` : line}>
        {expandable ? (
          <button
            type="button"
            className={disclosure}
            aria-expanded={open}
            aria-label={`${open ? 'Ocultar' : 'Ver'} el detalle de ${l.label}`}
            onClick={() => setOpen(!open)}
          >
            {open ? '−' : '+'}
          </button>
        ) : null}
        <span>
          <span className={lineLabel}>{l.label}</span>
          {l.subtitle ? <span className={lineSubtitle}>{l.subtitle}</span> : null}
        </span>
        <span className={lineAmount}>{monto(l, l.negative)}</span>
      </div>
      {open
        ? l.detalle?.map((d) => (
            <div key={d.label} className={subLine}>
              <span>{d.label}</span>
              <span className={lineAmount}>{monto(d, l.negative)}</span>
            </div>
          ))
        : null}
    </>
  );
}

/**
 * A statement line list.
 *
 * Every plain-language subtitle is the copy from the design brief, kept because
 * it is the brand trait that makes these numbers usable by someone who is not
 * finance-literate.
 */
export function Statement({
  title,
  lines,
}: {
  readonly title: string;
  readonly lines: readonly StatementLine[];
}) {
  return (
    <Card>
      <h2 className={lineLabel}>{title}</h2>
      {lines.map((l) => (
        <Linea key={l.label} l={l} />
      ))}
    </Card>
  );
}
