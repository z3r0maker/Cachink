import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import * as k from './corte.css';
import { conSigno, DIF, type CierreData } from '@xangarro/caja/cierre';
import type { Cierre } from './use-cierre';

/** «14 may», the day the turno closed. */
export function fechaCorta(d: Date = new Date()): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}

function Fila(p: { readonly label: string; readonly value: string; readonly color?: string }) {
  return (
    <div className={k.fila}>
      <span className={k.etiqueta}>{p.label}</span>
      <span className={k.valor} style={p.color ? { color: p.color } : undefined}>
        {p.value}
      </span>
    </div>
  );
}

/** «Corte de caja»: who, when, counted against expected, and the day's sales. */
export function Corte({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  const t = DIF[x.dif.tipo];
  return (
    <section aria-label="Corte de caja" className={k.corte}>
      <div className={k.cabeza}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className={k.eyebrow}>Corte de caja</span>
          <span className={k.fecha}>{`${fechaCorta()} · ${data.hasta}`}</span>
        </div>
        {data.negocio ? <span className={k.negocio}>{data.negocio}</span> : null}
      </div>
      <div className={k.bloque} style={{ paddingTop: 0 }}>
        <Fila label="Caja" value={data.caja} />
        <Fila label="Operadora" value={data.operador} />
        <Fila label="Turno" value={`${data.desde} a ${data.hasta}`} />
      </div>
      <div className={k.bloque}>
        <Fila label="Contado" value={formatMoney(x.contado)} />
        <Fila label="Esperado" value={formatMoney(x.esperado)} />
        <div
          className={k.diferencia}
          style={{ background: t.bg, color: t.color, borderColor: t.color }}
        >
          Diferencia
          <span className={k.valor} style={{ color: t.color }}>
            {conSigno(x.dif)}
          </span>
        </div>
      </div>
      <div className={k.bloque}>
        <Fila label="Ventas" value={String(data.resumen.ventas)} />
        <Fila label="Cobrado" value={formatMoney(data.resumen.cobrado)} color={colors.greenText} />
      </div>
      <div className={k.pie}>
        Guardado con tu nombre. Ya no puedes capturar en esta caja hasta abrir otro turno.
      </div>
    </section>
  );
}
