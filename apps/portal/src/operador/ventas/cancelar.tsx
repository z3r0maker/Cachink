'use client';

import { useState, type ReactNode } from 'react';
import { formatMoney } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import * as l from '../turno/lists.css';
import { ModalBotones } from '../ui/botones';
import { ChoiceChips } from '../ui/choice';
import * as f from '../ui/field.css';
import { OpModal } from '../ui/modal';
import { Note } from '../ui/note';
import * as u from '../ui/ui.css';
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
 * Ventas opens it with the sale's summary and a note; Detalle de venta with a
 * sentence, since the ticket is already on screen.
 */
export function CancelarVenta(p: {
  readonly titulo: string;
  readonly intro: ReactNode;
  readonly extra?: ReactNode;
  readonly aviso: string;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: Motivo) => void;
}) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  return (
    <OpModal
      open
      onClose={p.onClose}
      title={p.titulo}
      titleSize={portalFontSizes.lgx}
      width={480}
      headBg={colors.redSoft}
    >
      {p.intro}
      <ChoiceChips label="Motivo" options={MOTIVOS} value={motivo} onChange={setMotivo} />
      {p.extra}
      <Note bg={colors.warningSoft} textColor={colors.ink}>
        {p.aviso}
      </Note>
      <ModalBotones
        volver="Volver"
        confirmar="Cancelar la venta"
        listo={motivo !== null}
        tint={colors.redSoft}
        onBack={p.onClose}
        onConfirm={() => motivo && p.onConfirm(motivo)}
      />
    </OpModal>
  );
}

/** Ventas' version: the list row does not show the lines, so the modal sums them up. */
export function CancelarDeLista(p: {
  readonly venta: VentaTurno;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: Motivo) => void;
}) {
  return (
    <CancelarVenta
      titulo={`Cancelar venta ${p.venta.folio}`}
      intro={<Resumen venta={p.venta} />}
      extra={<NotaOpcional />}
      aviso="La venta queda visible como cancelada con tu nombre. Si fue en efectivo, el monto sale de lo esperado en caja."
      onClose={p.onClose}
      onConfirm={p.onConfirm}
    />
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
