'use client';

import { useEffect, useRef, useState } from 'react';

import { Calendario, vistaDe, type Vista } from './calendario';
import { fechaLarga } from './formato';
import * as s from './fecha.css';

/**
 * A date field with the boards' picker look: a button that shows the long
 * date and opens a month grid. The value stays `YYYY-MM-DD`, as the server
 * actions take it. Escape and a click outside close it.
 */
export interface FechaPickerProps {
  readonly id: string;
  readonly label: string;
  /** The popover's accessible name («Elige la fecha de apertura»). */
  readonly dialogo: string;
  readonly valor: string;
  readonly hoy: string;
  readonly disabled?: boolean;
  readonly onChange: (iso: string) => void;
}

export function FechaPicker(props: FechaPickerProps) {
  const { id, valor, hoy } = props;
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<Vista>(() => vistaDe(valor || hoy));
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  useCierre(abierto, caja, () => setAbierto(false), boton);
  const elegir = (iso: string) => {
    props.onChange(iso);
    setAbierto(false);
    boton.current?.focus();
  };

  return (
    <div className={s.campo} ref={caja}>
      <span id={`${id}-l`} className={s.etiqueta}>
        {props.label}
      </span>
      <Disparador
        id={id}
        texto={fechaLarga(valor)}
        abierto={abierto}
        disabled={props.disabled}
        boton={boton}
        onClick={() => {
          setVista(vistaDe(valor || hoy));
          setAbierto((a) => !a);
        }}
      />
      {abierto ? (
        <div className={s.popover} role="dialog" aria-label={props.dialogo}>
          <Calendario vista={vista} valor={valor} hoy={hoy} onVista={setVista} onElegir={elegir} />
        </div>
      ) : null}
    </div>
  );
}

/** Escape or a press outside closes the popover; on open, focus lands on the chosen day. */
function useCierre(
  abierto: boolean,
  caja: React.RefObject<HTMLDivElement | null>,
  cerrar: () => void,
  boton: React.RefObject<HTMLButtonElement | null>,
) {
  const cerrarRef = useRef(cerrar);
  cerrarRef.current = cerrar;
  useEffect(() => {
    if (!abierto) return;
    const el = caja.current;
    const dia =
      el?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
      el?.querySelector<HTMLButtonElement>('[data-dia]');
    dia?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      cerrarRef.current();
      boton.current?.focus();
    };
    const fuera = (e: PointerEvent) => {
      if (el !== null && !el.contains(e.target as Node)) cerrarRef.current();
    };
    document.addEventListener('keydown', tecla);
    document.addEventListener('pointerdown', fuera);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.removeEventListener('pointerdown', fuera);
    };
  }, [abierto, caja, boton]);
}

function Disparador({
  id,
  texto,
  abierto,
  disabled,
  boton,
  onClick,
}: {
  readonly id: string;
  readonly texto: string;
  readonly abierto: boolean;
  readonly disabled?: boolean;
  readonly boton: React.RefObject<HTMLButtonElement | null>;
  readonly onClick: () => void;
}) {
  return (
    <button
      ref={boton}
      type="button"
      className={s.disparador}
      aria-labelledby={`${id}-l ${id}-v`}
      aria-haspopup="dialog"
      aria-expanded={abierto}
      disabled={disabled}
      onClick={onClick}
    >
      <IconoCalendario />
      <span id={`${id}-v`} className={texto === '' ? `${s.valor} ${s.vacio}` : s.valor}>
        {texto === '' ? 'Elige la fecha' : texto}
      </span>
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden="true">
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
      </svg>
    </button>
  );
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
