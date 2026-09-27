import Link from 'next/link';
import { colors } from '@xangarro/tokens';
import { formatMoney, sum } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { OPERADOR_BASE } from '../shell/nav';
import { Panel } from '../ui/panel';
import * as m from './mi-turno.css';
import type { CobroPorMetodo, TurnoData } from './types';

const CANDADO =
  'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM7 11V7a5 5 0 0 1 10 0v4';

/** The four parts, signed the way the board reads them («+$1,980.00», «−$620.00»). */
function partes(d: TurnoData) {
  return [
    { label: 'Fondo de caja', nota: 'con el que abriste', valor: formatMoney(d.fondo) },
    { label: 'Ventas en efectivo', valor: `+${formatMoney(d.ventasEfectivo)}` },
    { label: 'Abonos en efectivo', valor: `+${formatMoney(d.abonosEfectivo)}` },
    { label: 'Gastos de caja chica', valor: `−${formatMoney(d.gastosEfectivo)}`, rojo: true },
  ];
}

/** «Efectivo que debe haber en la caja»: the figure, its parts, and the way to close. */
export function EsperadoCard({ data }: { readonly data: TurnoData }) {
  return (
    <section aria-label="Efectivo que debe haber en la caja" className={m.hero}>
      <span className={m.heroLabel}>Efectivo que debe haber en la caja</span>
      <span className={m.heroAmount}>{formatMoney(data.esperado)}</span>
      <span className={m.heroText}>Es lo que debes contar cuando cierres tu turno.</span>
      <div className={m.parts}>
        {partes(data).map((p) => (
          <div key={p.label} className={m.part}>
            <span className={m.partLabel}>{p.label}</span>
            {p.nota ? <span className={m.partNote}>{p.nota}</span> : null}
            <span className={m.partValue} style={p.rojo ? { color: colors.redText } : undefined}>
              {p.valor}
            </span>
          </div>
        ))}
        <div className={m.total}>
          <span className={m.totalLabel}>Debe haber</span>
          <span className={m.totalValue}>{formatMoney(data.esperado)}</span>
        </div>
      </div>
      <Link href={`${OPERADOR_BASE}/cierre`} className={m.cerrar}>
        <Icon path={CANDADO} size={20} strokeWidth={2.4} />
        Cerrar mi turno
      </Link>
    </section>
  );
}

const COLOR: Record<CobroPorMetodo['metodo'], string> = {
  Efectivo: colors.green,
  Tarjeta: colors.blueText,
  Transferencia: colors.purple,
  Fiado: colors.warning,
};

/** «Cobrado por método»: one bar per method, as a share of what was collected. */
export function PorMetodo({ items }: { readonly items: readonly CobroPorMetodo[] }) {
  const total = sum(items.map((i) => i.monto));
  const pct = (c: bigint) => (total === 0n ? 0 : Number((c * 1000n) / total) / 10);
  const head = <span className={m.panelTotal}>{formatMoney(total)}</span>;
  return (
    <Panel label="Cobrado por método" action={head}>
      <div className={m.metodos}>
        {items.map((i) => (
          <div key={i.metodo}>
            <div className={m.metodoHead}>
              <span className={m.metodoLabel}>{i.metodo}</span>
              <span className={m.metodoNota}>{i.nota}</span>
              <span className={m.metodoMonto}>{formatMoney(i.monto)}</span>
              <span className={m.metodoPct}>{Math.round(pct(i.monto))}%</span>
            </div>
            <div className={m.track}>
              <div
                className={m.bar}
                style={{ width: `${pct(i.monto)}%`, background: COLOR[i.metodo] }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
