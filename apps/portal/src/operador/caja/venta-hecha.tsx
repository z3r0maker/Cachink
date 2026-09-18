'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as t from '../ui/toast.css';
import * as u from '../ui/ui.css';
import type { Caja } from './use-caja';
import type { VentaHecha } from './use-sale-toast';
import * as v from './venta-hecha.css';

const CHECK = 'M20 6 9 17l-5-5';

/** The corner card after a sale; it fades by itself over ~8 s. */
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
      <div className={t.head} style={{ background: colors.greenSoft }}>
        <span style={{ color: colors.greenText, display: 'grid' }}>
          <Icon path={CHECK} size={20} strokeWidth={2.6} />
        </span>
        <span className={t.title}>Venta registrada · {formatMoney(venta.total)}</span>
        <span className={v.method}>{venta.metodo}</span>
      </div>
      <Cuerpo venta={venta} onDeshacer={caja.deshacer} onComprobante={onComprobante} />
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
    <div className={v.body}>
      {p.venta.cambio === null ? null : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className={u.eyebrow}>Cambio</span>
          <span className={v.cambio}>{formatMoney(p.venta.cambio)}</span>
        </div>
      )}
      {p.venta.nota ? <div className={v.nota}>{p.venta.nota}</div> : null}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          className={v.action}
          style={{ background: colors.redSoft }}
          onClick={p.onDeshacer}
        >
          Deshacer
        </button>
        <button
          type="button"
          className={v.action}
          style={{ background: colors.white }}
          onClick={p.onComprobante}
        >
          Comprobante
        </button>
      </div>
    </div>
  );
}
