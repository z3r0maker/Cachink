import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { SinResultados } from '../ui/filters';
import * as g from './gastos.css';
import { CAT_ICON, CAT_TINT, CAT_TINTA } from './icons';
import type { GastoTurno } from './types';

/** The turno's expenses, newest first; the amount in red because it left the drawer. */
export function ListaGastos(p: {
  readonly gastos: readonly GastoTurno[];
  readonly buscando: boolean;
}) {
  return (
    <section aria-label="Gastos" className={g.tabla}>
      <div className={g.encabezado} aria-hidden="true">
        <span />
        <span>Qué compraste</span>
        <span>Categoría</span>
        <span>Comprobante</span>
        <span>Hora</span>
        <span style={{ textAlign: 'right' }}>Salió</span>
      </div>
      {p.gastos.map((x) => (
        <Fila key={x.id} x={x} />
      ))}
      {p.gastos.length === 0 ? (
        <SinResultados
          body={
            p.buscando
              ? 'Ningún gasto de tu turno coincide con lo que buscas.'
              : 'En tu turno no ha salido dinero para esto.'
          }
        />
      ) : null}
    </section>
  );
}

function Fila({ x }: { readonly x: GastoTurno }) {
  const tinta = CAT_TINTA[x.categoria];
  const comp = x.comprobante
    ? { background: colors.greenSoft, color: colors.greenText, borderColor: colors.greenText }
    : {
        background: colors.warningSoft,
        color: colors.warningText,
        borderColor: colors.warningText,
      };
  return (
    <div className={g.fila}>
      <span className={g.tile} style={{ background: CAT_TINT[x.categoria] }}>
        <Icon path={CAT_ICON[x.categoria]} size={20} strokeWidth={2} />
      </span>
      <span className={g.que}>
        <span className={g.concepto}>{x.concepto}</span>
        <span className={g.detalle}>{x.detalle}</span>
      </span>
      <span className={g.chips}>
        <span
          className={g.chip}
          style={{ background: CAT_TINT[x.categoria], color: tinta, borderColor: tinta }}
        >
          {x.categoria}
        </span>
        <span className={g.chip} style={comp}>
          {x.comprobante ? 'Con foto' : 'Sin comprobante'}
        </span>
        <span className={g.hora}>{x.hora}</span>
      </span>
      <span className={g.monto}>{`−${formatMoney(x.monto)}`}</span>
    </div>
  );
}
