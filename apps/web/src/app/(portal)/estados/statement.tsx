import { formatMoney, type Money } from '@xangarro/domain';

import { Card } from '@/components';

import { line, lineAmount, lineLabel, lineSubtitle, lineTotal } from './estados.css';

export interface StatementLine {
  readonly label: string;
  readonly subtitle?: string;
  readonly amount: Money;
  readonly total?: boolean;
  /** Renders in parentheses — a subtraction in the statement's arithmetic. */
  readonly negative?: boolean;
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
        <div key={l.label} className={l.total ? `${line} ${lineTotal}` : line}>
          <span>
            <span className={lineLabel}>{l.label}</span>
            {l.subtitle ? <span className={lineSubtitle}>{l.subtitle}</span> : null}
          </span>
          <span className={lineAmount}>
            {l.negative ? `(${formatMoney(l.amount)})` : formatMoney(l.amount)}
          </span>
        </div>
      ))}
    </Card>
  );
}
