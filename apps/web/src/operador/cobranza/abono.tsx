'use client';

import { useState } from 'react';
import { formatMoney, toPesosString, type Money } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { parseRecibido } from '../caja/ticket';
import { rule } from '../caja/share.css';
import { ModalBotones } from '../ui/botones';
import { ChoiceChips } from '../ui/choice';
import { OpModal } from '../ui/modal';
import { MontoInput } from '../ui/monto';
import * as u from '../ui/ui.css';
import * as a from './abono.css';
import { rapidos } from './derive';
import { METODOS_ABONO, type MetodoAbono } from './types';

/** Where an amount would land: the domain's allocation, worded by the caller. */
export interface Vista {
  readonly texto: string;
  readonly restante: Money;
}

/**
 * Cobranza's modal shows the current balance and words «se aplica a» on one
 * line; Detalle de cliente's drops the balance box and stacks it.
 */
const VARIANTES = {
  cobranza: { id: 'ab-monto', saldo: true, apilado: false },
  detalle: { id: 'dc-monto', saldo: false, apilado: true },
} as const;

/** «Abono de …»: free amount or a quick one, the method, and where it lands (oldest first). */
export function RecibirAbono(p: {
  readonly nombre: string;
  readonly total: Money;
  readonly vista: (monto: Money) => Vista;
  readonly variante: keyof typeof VARIANTES;
  readonly onClose: () => void;
  readonly onSave: (metodo: MetodoAbono, monto: Money) => void;
}) {
  const v = VARIANTES[p.variante];
  const { raw, setRaw, metodo, setMetodo, monto, listo } = useAbono();
  return (
    <OpModal
      open
      onClose={p.onClose}
      title={`Abono de ${p.nombre}`}
      titleSize={portalFontSizes.lgx}
      width={520}
      headBg={colors.blueSoft}
    >
      {v.saldo ? <SaldoActual total={p.total} /> : null}
      <Monto id={v.id} raw={raw} setRaw={setRaw} total={p.total} />
      <Metodo value={metodo} onChange={setMetodo} />
      <SeAplica
        vista={monto !== null ? p.vista(monto) : null}
        total={p.total}
        apilado={v.apilado}
      />
      <ModalBotones
        volver="Cancelar"
        confirmar="Registrar abono"
        listo={listo}
        tint={colors.yellow}
        onBack={p.onClose}
        onConfirm={() => monto !== null && p.onSave(metodo, monto)}
      />
    </OpModal>
  );
}

function Metodo(p: { readonly value: MetodoAbono; readonly onChange: (m: MetodoAbono) => void }) {
  return (
    <ChoiceChips
      label="Cómo paga"
      options={METODOS_ABONO}
      value={p.value}
      onChange={p.onChange}
      height={44}
    />
  );
}

function useAbono() {
  const [raw, setRaw] = useState('');
  const [metodo, setMetodo] = useState<MetodoAbono>('Efectivo');
  const parsed = parseRecibido(raw);
  const monto = parsed !== null && parsed > 0n ? parsed : null;
  return { raw, setRaw, metodo, setMetodo, monto, listo: monto !== null };
}

function SaldoActual({ total }: { readonly total: Money }) {
  return (
    <div className={a.actual}>
      <span className={u.eyebrow}>Saldo actual</span>
      <span className={a.actualValue}>{formatMoney(total)}</span>
    </div>
  );
}

function Monto(p: {
  readonly id: string;
  readonly raw: string;
  readonly setRaw: (v: string) => void;
  readonly total: Money;
}) {
  return (
    <div>
      <MontoInput id={p.id} label="Cuánto abona" value={p.raw} onChange={p.setRaw} size="gasto" />
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 10 }}>
        {rapidos(p.total).map((x) => (
          <button
            key={String(x)}
            type="button"
            className={a.rapido}
            onClick={() => p.setRaw(toPesosString(x).replace(/\.00$/, ''))}
          >
            {x === p.total ? `Todo · ${formatMoney(x)}` : formatMoney(x)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SeAplica(p: {
  readonly vista: Vista | null;
  readonly total: Money;
  readonly apilado: boolean;
}) {
  const texto = p.vista?.texto ?? 'Elige un monto';
  return (
    <div className={a.aplica}>
      {p.apilado ? (
        <>
          <div className={u.eyebrow}>Se aplica a</div>
          <div className={a.aplicaText} style={{ marginLeft: 0, textAlign: 'left' }}>
            {texto}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className={u.eyebrow}>Se aplica a</span>
          <span className={a.aplicaText}>{texto}</span>
        </div>
      )}
      <div className={rule} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className={a.restanteLabel}>Saldo restante</span>
        <span className={p.apilado ? a.restanteChico : a.restante}>
          {formatMoney(p.vista?.restante ?? p.total)}
        </span>
      </div>
    </div>
  );
}
