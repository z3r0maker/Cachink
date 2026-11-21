'use client';

import { useId, useState } from 'react';

import { Button } from '@/components';
import { field, label } from '@/components/input.css';
import { PANTALLAS, type Pantalla } from '@/shell/pantallas';

import * as s from './formulario.css';

/**
 * The fields of «Escríbele al equipo» (P-48, board `RpAyuda`), split from the
 * form for the size ceiling. Each is presentational: the form holds the state.
 */

/** A question's subject: an input like any other, without the gap `Input` leaves under itself. */
export function Asunto(p: { readonly value: string; readonly onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div className={s.campo}>
      <label className={label} htmlFor={id}>
        Asunto
      </label>
      <input
        id={id}
        className={field}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        placeholder="No entiendo el corte del día"
        maxLength={120}
      />
    </div>
  );
}

/** The screens to pick from when it was not the one the person came from. */
function OtraPantalla(p: {
  readonly elegida: Pantalla | null;
  readonly onElegir: (pantalla: Pantalla) => void;
}) {
  return (
    <div className={s.pantallas} role="group" aria-label="Pantallas del portal">
      {PANTALLAS.map((pantalla) => (
        <button
          key={pantalla.href}
          type="button"
          className={s.pantallaChip}
          aria-pressed={p.elegida?.href === pantalla.href}
          onClick={() => p.onElegir(pantalla)}
        >
          {pantalla.label}
        </button>
      ))}
    </div>
  );
}

/**
 * «¿En qué pantalla?»: already filled with the screen the person came from,
 * with «Fue en otra» to change it. With no screen remembered it asks outright.
 */
export function EnQuePantalla(p: {
  readonly pantalla: Pantalla | null;
  /** True while the screen shown is the one the person came from, not one they picked. */
  readonly recordada: boolean;
  readonly onElegir: (pantalla: Pantalla) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const eligiendo = abierta || p.pantalla === null;
  return (
    <div className={s.pantalla}>
      <span className={s.pantallaTexto}>
        <span className={s.pantallaEtiqueta}>¿En qué pantalla?</span>
        {p.pantalla === null ? null : (
          <span className={s.pantallaNombre} data-testid="ayuda-pantalla">
            {p.pantalla.label}
          </span>
        )}
        {p.recordada && !abierta ? (
          <span className={s.pantallaPista}>Es donde estabas cuando abriste Ayuda.</span>
        ) : null}
      </span>
      {eligiendo ? null : (
        <Button variant="secondary" size="sm" onClick={() => setAbierta(true)}>
          Fue en otra
        </Button>
      )}
      {eligiendo ? (
        <OtraPantalla
          elegida={p.pantalla}
          onElegir={(pantalla) => {
            p.onElegir(pantalla);
            setAbierta(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** The message: «Mensaje» for a question, «¿Qué pasó?» (optional) for a report. */
export function Mensaje(p: {
  readonly etiqueta: string;
  readonly ejemplo: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className={s.campo}>
      <label className={label} htmlFor={id}>
        {p.etiqueta}
      </label>
      <textarea
        id={id}
        className={s.texto}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        placeholder={p.ejemplo}
        rows={4}
        maxLength={4000}
      />
    </div>
  );
}

/** What a report carries by itself, so the person need not explain it. */
export function VaConElReporte() {
  return (
    <div className={s.nota} role="status">
      <svg
        className={s.notaIcono}
        viewBox="0 0 24 24"
        width={18}
        height={18}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>
        Va con la pantalla, tu navegador y el último error que vimos en tu sesión. No tienes que
        explicarlo todo.
      </span>
    </div>
  );
}

export function Urgente(p: {
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <label className={s.urgente}>
      <input
        type="checkbox"
        className={s.urgenteCaja}
        checked={p.value}
        onChange={(e) => p.onChange(e.target.checked)}
      />
      Es urgente: mi negocio no puede operar
    </label>
  );
}
