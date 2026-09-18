'use client';

import { useState } from 'react';
import { formatMoney, toPesosString, type AplicacionAbono } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { parseRecibido } from '../caja/ticket';
import { rule } from '../caja/share.css';
import { ModalBotones } from '../ui/botones';
import { ChoiceChips } from '../ui/choice';
import { OpModal } from '../ui/modal';
import { MontoInput } from '../ui/monto';
import * as u from '../ui/ui.css';
import * as a from './abono.css';
import { aplicar, aplicaTexto, rapidos, saldo } from './derive';
import { METODOS_ABONO, type ClienteCobranza, type MetodoAbono } from './types';

/** «Abono de …»: free amount or a quick one, the method, and where it lands (oldest first). */
export function RecibirAbono(p: {
  readonly cliente: ClienteCobranza;
  readonly onClose: () => void;
  readonly onSave: (metodo: MetodoAbono, a: AplicacionAbono) => void;
}) {
  const [raw, setRaw] = useState('');
  const [metodo, setMetodo] = useState<MetodoAbono>('Efectivo');
  const total = saldo(p.cliente);
  const monto = parseRecibido(raw);
  const aplicacion = monto !== null && monto > 0n ? aplicar(p.cliente, monto) : null;
  return (
    <OpModal
      open
      onClose={p.onClose}
      title={`Abono de ${p.cliente.nombre}`}
      titleSize={portalFontSizes.lgx}
      width={520}
      headBg={colors.blueSoft}
    >
      <SaldoActual total={total} />
      <Monto raw={raw} setRaw={setRaw} total={total} />
      <ChoiceChips
        label="Cómo paga"
        options={METODOS_ABONO}
        value={metodo}
        onChange={setMetodo}
        height={44}
      />
      <SeAplica cliente={p.cliente} aplicacion={aplicacion} total={total} />
      <ModalBotones
        volver="Cancelar"
        confirmar="Registrar abono"
        listo={aplicacion !== null}
        tint={colors.yellow}
        onBack={p.onClose}
        onConfirm={() => aplicacion && p.onSave(metodo, aplicacion)}
      />
    </OpModal>
  );
}

function SaldoActual({ total }: { readonly total: bigint }) {
  return (
    <div className={a.actual}>
      <span className={u.eyebrow}>Saldo actual</span>
      <span className={a.actualValue}>{formatMoney(total)}</span>
    </div>
  );
}

function Monto(p: {
  readonly raw: string;
  readonly setRaw: (v: string) => void;
  readonly total: bigint;
}) {
  return (
    <div>
      <MontoInput
        id="ab-monto"
        label="Cuánto abona"
        value={p.raw}
        onChange={p.setRaw}
        size="gasto"
      />
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 10 }}>
        {rapidos(p.total).map((v) => (
          <button
            key={String(v)}
            type="button"
            className={a.rapido}
            onClick={() => p.setRaw(toPesosString(v).replace(/\.00$/, ''))}
          >
            {v === p.total ? `Todo · ${formatMoney(v)}` : formatMoney(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SeAplica(p: {
  readonly cliente: ClienteCobranza;
  readonly aplicacion: AplicacionAbono | null;
  readonly total: bigint;
}) {
  return (
    <div className={a.aplica}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className={u.eyebrow}>Se aplica a</span>
        <span className={a.aplicaText}>
          {p.aplicacion ? aplicaTexto(p.cliente, p.aplicacion) : 'Elige un monto'}
        </span>
      </div>
      <div className={rule} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className={a.restanteLabel}>Saldo restante</span>
        <span className={a.restante}>{formatMoney(p.aplicacion?.restante ?? p.total)}</span>
      </div>
    </div>
  );
}
