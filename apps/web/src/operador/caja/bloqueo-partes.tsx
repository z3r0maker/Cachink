'use client';

import type { ReactNode } from 'react';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as m from '../ui/mostrador.css';
import * as b from './bloqueo.css';

export interface Operador {
  readonly id: string;
  readonly nombre: string;
}

const CANDADO =
  'M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM8 11V7a4 4 0 0 1 8 0v4';
const CHECK = 'M20 6 9 17l-5-5';

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export function Iniciales({ nombre }: { readonly nombre: string }) {
  return (
    <span className={b.iniciales} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  );
}

/** Who is coming in: the turno's owner, or whoever takes the caja over. */
export function Quien(p: {
  readonly nombre: string;
  readonly mismo: boolean;
  readonly de: string;
}) {
  return (
    <div className={b.quien}>
      <Iniciales nombre={p.nombre} />
      <span>
        <span className={b.fuerte}>{p.nombre}</span>
        {p.mismo ? ' · su turno sigue abierto' : ` · entra al turno de ${p.de}`}
      </span>
    </div>
  );
}

/** The scrim over a blurred register, and the card with the lock and its title. */
export function Marco({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bl-t"
      data-testid="caja-bloqueada"
      className={b.scrim}
    >
      <div className={b.centro}>
        <div className={b.card}>
          <div className={b.fila}>
            <span className={b.candado} aria-hidden="true">
              <Icon path={CANDADO} size={28} strokeWidth={2.4} />
            </span>
            <span className={b.titulos}>
              <span className={m.eyebrow}>Caja 1</span>
              <h1 id="bl-t" className={b.titulo}>
                Caja bloqueada
              </h1>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** The ticket in progress survives the lock; without one, nobody sells until a NIP. */
export function Nota(p: {
  readonly de: string;
  readonly piezas: number;
  readonly total: string;
}): ReactNode {
  return (
    <div className={b.nota} data-testid="bloqueo-nota">
      {p.piezas > 0 ? (
        <>
          <span style={{ color: colors.greenText, display: 'grid' }}>
            <Icon path={CHECK} size={20} strokeWidth={2.4} />
          </span>
          <span className={b.notaTexto}>El ticket de {p.de} quedó guardado.</span>
          <span className={b.chip}>
            {p.piezas} {p.piezas === 1 ? 'pieza' : 'piezas'} · {p.total}
          </span>
        </>
      ) : (
        <span className={b.notaTexto}>
          Nadie puede cobrar hasta que alguien ponga su NIP. El turno de {p.de} sigue abierto.
        </span>
      )}
    </div>
  );
}

/** «¿Quién sigue en la caja?»: the business's operators; the next sales are theirs. */
export function QuienSigue(p: {
  readonly operadores: readonly Operador[];
  readonly elegido: string;
  readonly onElegir: (o: Operador) => void;
}): ReactNode {
  return (
    <div className={b.lista} role="group" aria-label="¿Quién sigue en la caja?">
      {p.operadores.map((o) => (
        <button
          key={o.id}
          type="button"
          className={b.operador}
          data-testid="bloqueo-operador"
          aria-pressed={p.elegido === o.id}
          onClick={() => p.onElegir({ id: o.id, nombre: o.nombre })}
        >
          <Iniciales nombre={o.nombre} />
          {o.nombre}
        </button>
      ))}
    </div>
  );
}
