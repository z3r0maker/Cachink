import type { UsageCounters as Counters } from '@/server/usage/counters';

import { Kpi } from '../turno';
import { counters } from './uso.css';

const n = (v: number) => v.toLocaleString('es-MX');

function overSub(c: Counters): string {
  if (c.overLimit > 0) return `${c.overLimit === 1 ? 'negocio' : 'negocios'} al 100 % o más`;
  if (c.topPercent === null) return 'nadie tiene límite que rebasar';
  return `ni cerca: el más alto va en ${c.topPercent} %`;
}

function twoSub(count: number): string {
  if (count === 0) return 'nadie para platicar de upgrade';
  return `${count === 1 ? 'negocio' : 'negocios'} para platicar de upgrade`;
}

/** Uso's top row: the month's volume and who is pushing their plan. */
export function UsageCounters({ c }: { readonly c: Counters | null }) {
  if (c === null) return null;
  const plus = c.more ? '+' : '';
  return (
    <div className={counters}>
      <Kpi
        label={`Transacciones · ${c.period}`}
        value={`${n(c.transactions)}${plus}`}
        sub={`entre ${c.businesses}${plus} negocios · el anterior: ${n(c.previous)}`}
      />
      <Kpi
        label="Sobre el límite"
        value={String(c.overLimit)}
        sub={overSub(c)}
        tone={c.overLimit > 0 ? 'bad' : 'ok'}
      />
      <Kpi
        label="2 meses seguidos"
        value={String(c.twoMonthsOver)}
        sub={twoSub(c.twoMonthsOver)}
        tone={c.twoMonthsOver > 0 ? 'bad' : 'ok'}
      />
    </div>
  );
}
