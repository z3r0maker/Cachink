'use client';

import { useState, type ReactNode } from 'react';

import { Continuar } from './boton';
import * as a from './acceso.css';

/** Whole-peso text as the design shows, e.g. «200». */
export const pesos = (centavos: bigint): string =>
  centavos % 100n === 0n
    ? String(centavos / 100n)
    : `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;

const QUICK = [50_000, 100_000, 200_000, 500_000].map(BigInt);

function QuickChips(p: { readonly onElegir: (v: bigint) => void }) {
  return (
    <div className={a.quick}>
      {QUICK.map((v) => (
        <button
          key={String(v)}
          type="button"
          className={a.quickChip}
          data-testid="fondo-quick"
          onClick={() => p.onElegir(v)}
        >
          ${pesos(v)}
        </button>
      ))}
    </div>
  );
}

function CampoFondo(p: { readonly raw: string; readonly onRaw: (v: string) => void }): ReactNode {
  return (
    <>
      <label className={a.paso} htmlFor="fondo">
        Fondo de caja
      </label>
      <input
        id="fondo"
        inputMode="decimal"
        className={a.code}
        placeholder="0"
        data-testid="fondo-input"
        value={p.raw}
        onChange={(e) => p.onRaw(e.target.value.replace(/[^\d.]/g, ''))}
      />
    </>
  );
}

function Ayuda(p: { readonly onElegir: (v: bigint) => void }): ReactNode {
  return (
    <>
      <QuickChips onElegir={p.onElegir} />
      <p className={a.hint}>
        Solo puede haber un turno abierto por caja. Si otra persona dejó el turno abierto, ciérralo
        antes de abrir el tuyo.
      </p>
    </>
  );
}

/**
 * Paso 3 · ¿Con cuánto abres la caja? The fondo counted is what every close
 * is measured against (O-03) — the turno cannot open without it.
 */
export function Fondo(p: {
  readonly operador: string;
  readonly negocio: string;
  readonly onAbierto: (fondoCentavos: bigint) => void;
}) {
  const [raw, setRaw] = useState('');
  const centavos = /^\d+(\.\d{1,2})?$/.test(raw.trim()) ? Math.round(Number(raw) * 100) : null;
  const listo = centavos !== null && centavos > 0;

  return (
    <>
      <span className={a.paso}>
        {p.operador} · {p.negocio}
      </span>
      <h1 className={a.title}>¿Con cuánto abres la caja?</h1>
      <p className={a.body}>
        Cuenta el efectivo con el que empiezas. Contra este fondo se calcula lo esperado cuando
        cierres.
      </p>
      <CampoFondo raw={raw} onRaw={setRaw} />
      <Ayuda onElegir={(v) => setRaw(pesos(v))} />
      <Continuar
        listo={listo}
        testId="fondo-abrir"
        onClick={() => (listo ? p.onAbierto(BigInt(centavos)) : undefined)}
      >
        Abrir turno y empezar a cobrar
      </Continuar>
    </>
  );
}
