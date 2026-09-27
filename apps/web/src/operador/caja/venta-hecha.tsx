'use client';

import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import * as m from '../ui/mostrador.css';
import type { Caja } from './use-caja';
import type { VentaHecha } from './use-sale-toast';
import * as v from './venta-hecha.css';

const CHECK = 'M20 6 9 17l-5-5';
const WA =
  'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719';

/** The corner card after a sale: the change due, the comprobante, Deshacer; it fades in ~8 s. */
export function VentaHechaCard({
  caja,
  onComprobante,
}: {
  readonly caja: Caja;
  readonly onComprobante: () => void;
}) {
  const venta = caja.toast.venta;
  if (!venta) return null;
  return (
    <div role="status" className={v.card}>
      <div className={v.body}>
        <div className={v.top}>
          <span className={v.check} aria-hidden="true">
            <Icon path={CHECK} size={20} strokeWidth={3} />
          </span>
          <span className={v.titulos}>
            <span className={m.eyebrow}>{venta.metodo}</span>
            <span className={v.titulo}>Venta registrada · {formatMoney(venta.total)}</span>
          </span>
        </div>
        <Cuerpo venta={venta} onDeshacer={caja.deshacer} onComprobante={onComprobante} />
      </div>
      <div className={v.track}>
        <div className={v.fill} style={{ width: `${caja.toast.progress}%` }} />
      </div>
    </div>
  );
}

function Cuerpo(p: {
  readonly venta: VentaHecha;
  readonly onDeshacer: () => void;
  readonly onComprobante: () => void;
}) {
  return (
    <>
      {p.venta.cambio === null ? null : (
        <div className={v.cambioBox}>
          <span className={v.cambioK}>Dale de cambio</span>
          <span className={v.cambio}>{formatMoney(p.venta.cambio)}</span>
        </div>
      )}
      {p.venta.nota ? <div className={v.nota}>{p.venta.nota}</div> : null}
      <div className={v.acciones}>
        <button
          type="button"
          className={`${m.boton.secundario} ${v.crece}`}
          onClick={p.onComprobante}
        >
          <Icon path={WA} size={18} strokeWidth={2.2} />
          Comprobante
        </button>
        <button type="button" className={m.boton.quieto} onClick={p.onDeshacer}>
          Deshacer
        </button>
      </div>
    </>
  );
}
