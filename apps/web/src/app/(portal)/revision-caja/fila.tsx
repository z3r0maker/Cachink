import { formatMoney } from '@xangarro/domain';

import { Button } from '@/components';
import { Icon } from '@/shell/icon';

import * as s from './revision.css';
import type { ClienteCaja, ProductoCaja } from './types';

const PRODUCTO = 'M21 8 12 3 3 8v8l9 5 9-5V8Zm-9 5L3 8m9 5 9-5m-9 5v8';
const CLIENTE = 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8';
const CERRAR = 'M6 6l12 12M18 6 6 18';

/** One record: who created it and where, how often it sold, what it looks like, and the exits. */
export function Fila(p: {
  readonly x: ProductoCaja | ClienteCaja;
  readonly onRevisar: () => void;
  readonly onRechazar: () => void;
}) {
  const esCliente = 'fiado' in p.x;
  return (
    <div className={s.fila}>
      <span className={s.tile} style={{ background: p.x.tint }}>
        <Icon path={esCliente ? CLIENTE : PRODUCTO} size={21} strokeWidth={2.3} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span className={s.nombre}>{p.x.nombre}</span>
          {p.x.pareceA ? <span className={s.parece}>{`Se parece a ${p.x.pareceA}`}</span> : null}
        </div>
        <div className={s.detalle}>{p.x.detalle}</div>
      </div>
      <div style={{ flex: 'none', minWidth: 120, textAlign: 'right' }}>
        <div className={s.cifra}>{formatMoney('fiado' in p.x ? p.x.fiado : p.x.precio)}</div>
        <div className={s.cifraLabel}>{esCliente ? 'Fiado acumulado' : 'Precio en caja'}</div>
      </div>
      <div style={{ flex: 'none', display: 'flex', gap: 9 }}>
        <Button size="sm" onClick={p.onRevisar}>
          Revisar
        </Button>
        <button type="button" className={s.rechazar} title="Rechazar" onClick={p.onRechazar}>
          <Icon path={CERRAR} size={17} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
