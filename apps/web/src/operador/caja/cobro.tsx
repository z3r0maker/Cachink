'use client';

import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import * as p from './cobro-panel.css';
import { Credito } from './credito';
import { Efectivo } from './efectivo';
import type { CajaData } from '@xangarro/caja/caja';
import type { Caja, MetodoCobro } from './use-caja';

const METODOS: readonly MetodoCobro[] = ['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado'];
const TITLES = { efectivo: 'Paga en efectivo', credito: 'Anótalo a su cuenta' } as const;
const BACK = 'M15 6l-6 6 6 6';

/** How the customer pays, chosen where the total is. */
export function Metodos({ caja }: { readonly caja: Caja }) {
  return (
    <div className={p.metodos} role="radiogroup" aria-label="Cómo paga">
      {METODOS.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={caja.metodo === m}
          className={p.metodo}
          onClick={() => caja.setMetodo(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export interface PasoCobroProps {
  readonly caja: Caja;
  readonly data: CajaData;
  /** False on a linked register: fiado needs an existing client (O-33). */
  readonly permitirNuevo?: boolean;
}

/** Cash with change, or fiado with a client: the ticket's own second step. */
export function PasoCobro({ caja, data, permitirNuevo = true }: PasoCobroProps) {
  if (caja.paso !== 'efectivo' && caja.paso !== 'credito') return null;
  return (
    <section className={p.paso} aria-label="Cobro">
      <div className={p.pasoHead}>
        <button
          type="button"
          className={p.pasoBack}
          title="Volver al ticket"
          onClick={() => caja.setPaso('catalogo')}
        >
          <Icon path={BACK} size={18} strokeWidth={2.5} />
        </button>
        <span className={p.pasoTitles}>
          <span className={p.pasoEyebrow}>
            {data.siguienteFolio} · {caja.count} {caja.count === 1 ? 'pieza' : 'piezas'}
          </span>
          <h2 className={p.pasoTitle}>{TITLES[caja.paso]}</h2>
        </span>
        <span className={p.pasoTotal}>{formatMoney(caja.total)}</span>
      </div>
      <div className={p.pasoBody}>
        {caja.paso === 'efectivo' ? <Efectivo caja={caja} /> : null}
        {caja.paso === 'credito' ? (
          <Credito caja={caja} clientes={data.clientes} permitirNuevo={permitirNuevo} />
        ) : null}
      </div>
    </section>
  );
}
