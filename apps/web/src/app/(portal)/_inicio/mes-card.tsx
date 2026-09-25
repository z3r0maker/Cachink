import { formatMoney } from '@xangarro/domain';

import { Don } from '@/components';
import type { InicioData } from '@/server/inicio';

import * as s from './hoy.css';

/** Share of the bigger of two amounts, as a CSS width; 0 when both are 0. */
function share(part: bigint, whole: bigint): string {
  if (whole <= 0n) return '0%';
  return `${Number((part * 1000n) / whole) / 10}%`;
}

/** Ventas against gastos as two bars on one scale, the bigger one full. */
function Bars({ ventas, gastos }: { readonly ventas: bigint; readonly gastos: bigint }) {
  const top = ventas > gastos ? ventas : gastos;
  return (
    <div
      className={s.bars}
      role="img"
      aria-label={`Vendiste ${formatMoney(ventas)} y gastaste ${formatMoney(gastos)}`}
    >
      <span className={s.barLabel}>Vendiste</span>
      <span className={s.barTrack}>
        <span className={s.barFill.ventas} style={{ width: share(ventas, top) }} />
      </span>
      <span className={`${s.barValue} ${s.figureTone.pos}`}>{formatMoney(ventas)}</span>
      <span className={s.barLabel}>Gastaste</span>
      <span className={s.barTrack}>
        <span className={s.barFill.gastos} style={{ width: share(gastos, top) }} />
      </span>
      <span className={`${s.barValue} ${s.figureTone.neg}`}>{formatMoney(gastos)}</span>
    </div>
  );
}

/** The month at a glance: what was left, and ventas against gastos as two bars. */
export function MesCard({
  month,
  rango,
}: {
  readonly month: InicioData['month'];
  readonly rango: string;
}) {
  const neg = month.utilidad < 0n;
  return (
    <section className={s.quiet} aria-labelledby="mes-t">
      <div className={s.cardHead}>
        <h2 id="mes-t" className={s.eyebrow} style={{ margin: 0 }}>
          Lo que te quedó · {rango}
        </h2>
        <a className={s.cardLink} href="/estados">
          Ver estados financieros
        </a>
      </div>
      <span className={`${s.bigFigure} ${s.figureTone[neg ? 'neg' : 'pos']}`}>
        {formatMoney(month.utilidad)}
      </span>
      <span className={s.smallLabel}>
        {neg ? 'Tu negocio operó a pérdida este periodo.' : 'Tu negocio fue rentable este periodo.'}
      </span>
      <Bars ventas={month.ventas} gastos={month.gastos} />
    </section>
  );
}

/** Today so far, with Don Cuentas's word when nothing has arrived yet. */
export function HoyCard({ today }: { readonly today: InicioData['today'] }) {
  const vacio = today.ventasCount === 0 && today.gastosCount === 0;
  return (
    <section className={s.quiet} aria-labelledby="hoy-t">
      <h2 id="hoy-t" className={s.eyebrow} style={{ margin: 0 }}>
        Hoy
      </h2>
      <div className={s.hoyGrid}>
        <div>
          <span className={s.smallLabel}>Ventas</span>
          <span className={`${s.midFigure} ${s.figureTone.pos}`}>{formatMoney(today.ventas)}</span>
          <span className={s.smallLabel}>{today.ventasCount} ventas registradas</span>
        </div>
        <div>
          <span className={s.smallLabel}>Gastos</span>
          <span className={`${s.midFigure} ${s.figureTone.ink}`}>{formatMoney(today.gastos)}</span>
          <span className={s.smallLabel}>{today.gastosCount} egresos registrados</span>
        </div>
      </div>
      {vacio ? (
        <div className={s.cardHead}>
          <Don pose="pensando" size={44} />
          <span className={s.smallLabel} style={{ flex: 1 }}>
            Tus cajas todavía no mandan movimientos de hoy.
          </span>
        </div>
      ) : null}
    </section>
  );
}
