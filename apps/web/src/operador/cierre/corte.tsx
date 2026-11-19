import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as k from './corte.css';
import { conSigno, DIF, recordatorioEfectivo, type CierreData } from '@xangarro/caja/cierre';
import type { Cierre } from './use-cierre';

const BILLETE = 'M2 6h20v12H2V6Zm10 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 12h.01M18 12h.01';

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

function Cabeza(p: { readonly data: CierreData; readonly fecha: string }) {
  return (
    <div className={k.cabeza}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className={k.eyebrow}>Corte de caja</span>
        <span className={k.fecha}>{`${p.fecha} · ${p.data.hasta}`}</span>
      </div>
      {p.data.negocio ? <span className={k.negocio}>{p.data.negocio}</span> : null}
    </div>
  );
}

/**
 * «Corte de caja» (OpCierreCorte, P-43): who, when, counted against expected,
 * the day's sales, and at its foot the reminder that the counted cash is los
 * patrones' (ADR-147: a reminder, not a record).
 */
export function Corte(p: {
  readonly x: Cierre;
  readonly data: CierreData;
  readonly fecha: string;
}) {
  const { x, data } = p;
  const t = DIF[x.dif.tipo];
  return (
    <section aria-label="Corte de caja" className={k.corte}>
      <Cabeza data={data} fecha={p.fecha} />
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
      <p className={k.recordatorio} data-testid="cierre-recordatorio">
        <Icon path={BILLETE} size={24} strokeWidth={2} />
        {recordatorioEfectivo(x.contado)}
      </p>
    </section>
  );
}
