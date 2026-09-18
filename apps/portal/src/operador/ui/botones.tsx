import { colors } from '@xangarro/tokens';

import * as n from '../caja/nuevo.css';

/**
 * A modal's foot: the plain way back and the one confirm, 52 px. The confirm
 * takes its tint only once the form is complete (gray at half opacity before).
 */
export function ModalBotones(p: {
  readonly volver: string;
  readonly confirmar: string;
  readonly listo: boolean;
  /** Red on cancellations, yellow on captures. */
  readonly tint: string;
  readonly onBack: () => void;
  readonly onConfirm: () => void;
}) {
  const onYellow = p.tint === colors.yellow ? '' : undefined;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button type="button" className={n.cancel} style={{ height: 52 }} onClick={p.onBack}>
        {p.volver}
      </button>
      <button
        type="button"
        className={n.add}
        style={{ height: 52, background: p.listo ? p.tint : colors.gray100 }}
        disabled={!p.listo}
        data-onyellow={onYellow}
        onClick={p.onConfirm}
      >
        {p.confirmar}
      </button>
    </div>
  );
}
