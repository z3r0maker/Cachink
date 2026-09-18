'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import * as l from '../turno/lists.css';
import { ChoiceChips } from '../ui/choice';
import * as f from '../ui/field.css';
import { OpModal } from '../ui/modal';
import { Note } from '../ui/note';
import * as u from '../ui/ui.css';
import * as n from '../caja/nuevo.css';
import type { VentaTurno } from './types';
import * as v from './ventas.css';

export const MOTIVOS = [
  'Error de captura',
  'El cliente se arrepintió',
  'Producto equivocado',
  'Cobro duplicado',
] as const;
export type Motivo = (typeof MOTIVOS)[number];

/**
 * Cancel a sale of the open turno (rule 6): a reason is required, nothing is
 * deleted. Rendered only while a sale is chosen, so each opening starts clean.
 */
export function CancelarVenta(p: {
  readonly venta: VentaTurno;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: Motivo) => void;
}) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  return (
    <OpModal
      open
      onClose={p.onClose}
      title={`Cancelar venta ${p.venta.folio}`}
      titleSize={portalFontSizes.lgx}
      width={480}
      headBg={colors.redSoft}
    >
      <Resumen venta={p.venta} />
      <ChoiceChips label="Motivo" options={MOTIVOS} value={motivo} onChange={setMotivo} />
      <NotaOpcional />
      <Note bg={colors.warningSoft} textColor={colors.ink}>
        La venta queda visible como cancelada con tu nombre. Si fue en efectivo, el monto sale de lo
        esperado en caja.
      </Note>
      <Botones
        listo={motivo !== null}
        onBack={p.onClose}
        onConfirm={() => motivo && p.onConfirm(motivo)}
      />
    </OpModal>
  );
}

function Resumen({ venta }: { readonly venta: VentaTurno }) {
  return (
    <div className={v.resumen}>
      <div className={l.name} style={{ letterSpacing: 'normal' }}>
        {venta.concepto}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
        <span className={u.eyebrow}>
          {venta.metodo} · {venta.hora}
        </span>
        <span className={v.resumenAmount}>{formatMoney(venta.monto)}</span>
      </div>
    </div>
  );
}

function NotaOpcional() {
  return (
    <div>
      <label htmlFor="vc-nota" className={f.label}>
        Nota (opcional)
      </label>
      <input id="vc-nota" type="text" className={f.text} placeholder="Se cobró de más" />
    </div>
  );
}

function Botones(p: {
  readonly listo: boolean;
  readonly onBack: () => void;
  readonly onConfirm: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button type="button" className={n.cancel} style={{ height: 52 }} onClick={p.onBack}>
        Volver
      </button>
      <button
        type="button"
        className={n.add}
        style={{ height: 52, background: p.listo ? colors.redSoft : colors.gray100 }}
        disabled={!p.listo}
        onClick={p.onConfirm}
      >
        Cancelar la venta
      </button>
    </div>
  );
}
