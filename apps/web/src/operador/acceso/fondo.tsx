'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import { Continuar } from './boton';
import { Cabeza, type Otro } from './fondo-cabeza';
import * as f from './fondo.css';
import * as fp from './fondo-pie.css';

const RELOJ = 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2';
const QUICK = [50_000, 100_000, 200_000, 500_000].map(BigInt);

/** Plain text for the field, e.g. «500.00». */
export const pesos = (centavos: bigint): string =>
  `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;

/** «$1,234.00», the way money reads everywhere in the caja. */
export const dinero = (centavos: bigint): string =>
  `$${(Number(centavos) / 100).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** The typed fondo in centavos, or `null` while it is not an amount. */
export function centavosDe(raw: string): bigint | null {
  const limpio = raw.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{0,2})?$/.test(limpio)) return null;
  return BigInt(Math.round(Number(limpio) * 100));
}

function Rapidos(p: { readonly actual: bigint | null; readonly onElegir: (v: bigint) => void }) {
  return (
    <div role="group" aria-label="Montos rápidos" className={f.chips}>
      {QUICK.map((v) => (
        <button
          key={String(v)}
          type="button"
          className={f.chip}
          aria-pressed={p.actual === v}
          data-testid="fondo-quick"
          onClick={() => p.onElegir(v)}
        >
          {dinero(v).replace('.00', '')}
        </button>
      ))}
    </div>
  );
}

function Campo(p: {
  readonly raw: string;
  readonly onRaw: (v: string) => void;
  readonly onEnter: () => void;
  /** The note under the field describes it (the first turno only). */
  readonly nota: boolean;
}): ReactNode {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className={f.campo}>
      <span className={f.signo} aria-hidden="true">
        $
      </span>
      <input
        ref={ref}
        id="fondo"
        inputMode="decimal"
        autoComplete="off"
        className={f.input}
        placeholder="0.00"
        aria-describedby={p.nota ? 'fondo-nota' : undefined}
        data-testid="fondo-input"
        value={p.raw}
        onChange={(e) => p.onRaw(e.target.value.replace(/[^\d.,]/g, ''))}
        onKeyDown={(e) => (e.key === 'Enter' ? p.onEnter() : undefined)}
      />
      <span className={f.mxn}>MXN</span>
    </div>
  );
}

function Pie(p: {
  readonly centavos: bigint | null;
  readonly onAbrir: () => void;
  readonly onCancelar: () => void;
}): ReactNode {
  const listo = p.centavos !== null;
  return (
    <>
      <div className={fp.acciones}>
        <button type="button" className={fp.ahoritaNo} onClick={p.onCancelar}>
          Ahorita no
        </button>
        <Continuar listo={listo} testId="fondo-abrir" className={fp.abrir} onClick={p.onAbrir}>
          {p.centavos === null ? 'Abrir turno' : `Abrir turno con ${dinero(p.centavos)}`}
        </Continuar>
      </div>
      <span className={fp.tecla}>
        <kbd className={fp.kbd}>Enter</kbd>
        para abrir
      </span>
    </>
  );
}

function Nota(): ReactNode {
  return (
    <div id="fondo-nota" className={f.nota}>
      <Icon path={RELOJ} size={20} strokeWidth={2} />
      <span>
        Contra este fondo se cuadra tu corte al cerrar. Solo puede haber un turno abierto por caja:
        si otra persona dejó el suyo abierto, que lo cierre antes.
      </span>
    </div>
  );
}

/**
 * ¿Con cuánto empiezas? (OpAbrirTurno). The fondo counted is what every close
 * is measured against (O-03): the turno cannot open without it. «Ahorita no»,
 * the X and Esc go back to the NIP. With `otro`, it opens the next turno from
 * the closed screen: «¿Con cuánto sigues?», the count already written in.
 */
export function Fondo(p: {
  readonly operador: string;
  readonly onAbierto: (fondoCentavos: bigint) => void;
  readonly onCancelar: () => void;
  readonly otro?: Otro;
  readonly pie?: ReactNode;
}) {
  const [raw, setRaw] = useState(() => (p.otro === undefined ? '' : pesos(p.otro.contado)));
  const centavos = centavosDe(raw);
  const abrir = (): void => (centavos === null ? undefined : p.onAbierto(centavos));
  return (
    <div className={f.overlay} onKeyDown={(e) => (e.key === 'Escape' ? p.onCancelar() : undefined)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fondo-titulo"
        aria-describedby="fondo-sub"
        className={f.dialog}
      >
        <Cabeza operador={p.operador} otro={p.otro} onCancelar={p.onCancelar} />
        <div className={f.bloque}>
          <label htmlFor="fondo" className={f.eyebrow}>
            Fondo de caja
          </label>
          <Campo raw={raw} onRaw={setRaw} onEnter={abrir} nota={p.otro === undefined} />
          <Rapidos actual={centavos} onElegir={(v) => setRaw(pesos(v))} />
        </div>
        {p.otro === undefined ? <Nota /> : null}
        {raw !== '' && centavos === null ? (
          <span role="alert" className={f.alerta}>
            Escribe con cuánto empiezas. Si no dejaste fondo, pon 0.00.
          </span>
        ) : null}
        <Pie centavos={centavos} onAbrir={abrir} onCancelar={p.onCancelar} />
        {p.pie}
      </div>
    </div>
  );
}
