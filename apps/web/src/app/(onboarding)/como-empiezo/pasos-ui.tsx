import { colors } from '@xangarro/tokens';

import { DonDice } from '@/components';
import { button } from '@/components/button.css';
import type { Checklist, ChecklistItem } from '@/onboarding/checklist';
import { ICON } from '@/onboarding/ui/icons';
import { Icon } from '@/shell/icon';

import * as s from './pasos.css';

/** A big progress ring with the count inside it. */
function Ring({ done, total }: { readonly done: number; readonly total: number }) {
  const circ = 2 * Math.PI * 54;
  const filled = total === 0 ? 0 : (done / total) * circ;
  return (
    <svg viewBox="0 0 132 132" width={132} height={132} aria-hidden="true" style={{ flex: 'none' }}>
      <circle
        cx={66}
        cy={66}
        r={54}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={16}
      />
      <circle
        cx={66}
        cy={66}
        r={54}
        fill="none"
        stroke={colors.yellow}
        strokeWidth={16}
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 66 66)"
      />
      <text x={66} y={74} textAnchor="middle" className={s.ringText}>
        {done}/{total}
      </text>
    </svg>
  );
}

/** Progress, what to do next, and Don Cuentas pointing at it. */
export function PasosHero({ c }: { readonly c: Checklist }) {
  const siguiente = c.items.find((i) => !i.done);
  // Every step, optional ones included — the same count as the sidebar card.
  const hechos = c.items.filter((i) => i.done).length;
  return (
    <section className={s.hero}>
      <Ring done={hechos} total={c.items.length} />
      <div className={s.heroText}>
        <span className={s.eyebrow}>Tu changarro, paso a paso</span>
        <h1 className={s.title}>Primeros pasos</h1>
        <p className={s.sub}>
          {c.complete
            ? '¡Ya puedes vender! Lo que queda es opcional y se marca solo cuando lo haces.'
            : `${c.total} pasos para vender con Xangarro. Se marcan solos conforme los haces.`}
        </p>
      </div>
      {siguiente === undefined ? null : (
        <div style={{ flex: '1 1 300px' }}>
          <DonDice pose="senalando" size={110}>
            Sigue con «{siguiente.title}». {siguiente.hint}
          </DonDice>
        </div>
      )}
    </section>
  );
}

/** A finished required list shrinks to chips: done, out of the way. */
export function Hechos({ items }: { readonly items: readonly ChecklistItem[] }) {
  return (
    <ul className={s.chips} data-testid="checklist-requerido">
      {items.map((item) => (
        <li key={item.key} className={s.chip} data-done={item.done} data-group={item.group}>
          <span className={s.check} aria-hidden="true">
            <Icon path={ICON.check} size={14} strokeWidth={3} />
          </span>
          {item.title}
        </li>
      ))}
    </ul>
  );
}

type Estado = 'actual' | 'pendiente' | 'listo';

function Paso({
  item,
  n,
  estado,
}: {
  readonly item: ChecklistItem;
  readonly n: number;
  readonly estado: Estado;
}) {
  return (
    <li className={`${s.stepBox} ${s.step[estado]}`} data-done={item.done} data-group={item.group}>
      <span className={`${s.node} ${s.nodeTone[estado]}`} aria-hidden="true">
        {item.done ? <Icon path={ICON.check} size={18} strokeWidth={3} /> : n}
      </span>
      <span className={s.stepText}>
        <span className={s.stepTitle}>{item.title}</span>
        <span className={s.stepHint}>{item.hint}</span>
      </span>
      {item.done ? (
        <span className={s.stepHint}>Listo</span>
      ) : item.href === null ? (
        <span className={s.stepHint}>Se marca solo</span>
      ) : (
        <a
          className={button({ variant: estado === 'actual' ? 'primary' : 'secondary', size: 'sm' })}
          href={item.href}
        >
          Hacerlo
        </a>
      )}
    </li>
  );
}

/** The steps as a path: the first open one is where you are. */
export function Camino(props: {
  readonly items: readonly ChecklistItem[];
  readonly group: string;
  readonly start: number;
}) {
  const actual = props.items.findIndex((i) => !i.done);
  return (
    <ul className={s.path} data-testid={`checklist-${props.group}`}>
      {props.items.map((item, i) => (
        <Paso
          key={item.key}
          item={item}
          n={props.start + i}
          estado={item.done ? 'listo' : i === actual ? 'actual' : 'pendiente'}
        />
      ))}
    </ul>
  );
}

/** «Para vender»'s own count: the required steps only, which gate the portal (P-36 D-2). */
export function Cuenta({ c }: { readonly c: Checklist }) {
  return (
    <span className={c.complete ? s.countDone : s.countOpen}>
      {c.done} de {c.total} listos
    </span>
  );
}
