'use client';

import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import * as b from './barra.css';
import type { Caja } from './use-caja';

const TRASH =
  'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2';

/** Narrow band and phones: the black bar under the catalogue that opens the ticket. */
export function TicketBar({ caja }: { readonly caja: Caja }) {
  const hay = caja.count > 0;
  return (
    <div className={b.bar} data-show={caja.sheetOpen ? undefined : ''} aria-live="polite">
      {hay ? (
        <span className={b.resumen}>
          <span className={b.piezas}>
            {caja.count} {caja.count === 1 ? 'pieza' : 'piezas'} ·
          </span>
          <span className={b.total}>{formatMoney(caja.total)}</span>
        </span>
      ) : (
        <span className={b.vacio}>Toca un producto para empezar</span>
      )}
      {hay ? (
        <button
          type="button"
          className={b.vaciar}
          aria-label="Vaciar el ticket"
          onClick={() => caja.setLines([])}
        >
          <Icon path={TRASH} size={18} strokeWidth={2} />
        </button>
      ) : null}
      <button
        type="button"
        className={b.cobrar}
        aria-label="Cobrar, ver el ticket"
        disabled={!hay}
        onClick={() => caja.setSheetOpen(true)}
      >
        Cobrar
      </button>
    </div>
  );
}
