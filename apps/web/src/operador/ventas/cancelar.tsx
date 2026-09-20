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
 *
 * Design amendment (O-32, recorded in the plan): a linked register also asks
 * for the operator's NIP — the domain's CancelarTicketUseCase verifies it, and
 * it is the control against cancelling cash sales on an unlocked caja. The
 * fixture path renders the file's dialog unchanged.
 */
export function CancelarVenta(p: {
  readonly titulo: string;
  readonly intro: ReactNode;
  readonly aviso: string;
  readonly conNip?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: Motivo, nip: string, nota: string) => void;
}) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [nip, setNip] = useState('');
  const [nota, setNota] = useState('');
  const nipValido = p.conNip !== true || /^\d{4}$/.test(nip);
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
      <NotaOpcional value={nota} onChange={setNota} />
      {p.conNip ? <CampoNip value={nip} onChange={setNip} /> : null}
      <Note bg={colors.warningSoft} textColor={colors.ink}>
        {p.aviso}
      </Note>
      <ModalBotones
        volver="Volver"
        confirmar="Cancelar la venta"
        listo={motivo !== null && nipValido}
        tint={colors.redSoft}
        onBack={p.onClose}
        onConfirm={() => motivo && p.onConfirm(motivo, nip, nota)}
      />
    </OpModal>
  );
}

/** The amendment's field: four digits, the operator signing the cancellation. */
function CampoNip(p: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="vc-nip" className={f.label}>
        Tu NIP
      </label>
      <input
        id="vc-nip"
        type="password"
        inputMode="numeric"
        maxLength={4}
        className={f.text}
        placeholder="4 dígitos"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        data-testid="cancelar-nip"
      />
    </div>
  );
}

/** Ventas' version: the list row does not show the lines, so the modal sums them up. */
export function CancelarDeLista(p: {
  readonly venta: VentaTurno;
  readonly conNip?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: Motivo, nip: string, nota: string) => void;
}) {
  return (
    <CancelarVenta
      titulo={`Cancelar venta ${p.venta.folio}`}
      intro={<Resumen venta={p.venta} />}
      conNip={p.conNip}
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

function NotaOpcional(p: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="vc-nota" className={f.label}>
        Nota (opcional)
      </label>
      <input
        id="vc-nota"
        type="text"
        className={f.text}
        placeholder="Se cobró de más"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        data-testid="cancelar-nota"
      />
    </div>
  );
}
