'use client';

import * as RadioGroup from '@radix-ui/react-radio-group';
import { useId } from 'react';

import * as s from './formulario.css';

/** What the person needs from the team: an answer, or something fixed. */
export type Que = 'duda' | 'falla';

interface Opcion {
  readonly value: Que;
  readonly titulo: string;
  readonly detalle: string;
  /** Lucide-idiom path data on a 24×24 viewBox. */
  readonly icono: string;
}

const OPCIONES: readonly Opcion[] = [
  {
    value: 'duda',
    titulo: 'Tengo una duda',
    detalle: 'Cómo se hace algo o qué significa un número.',
    icono:
      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  },
  {
    value: 'falla',
    titulo: 'Algo no funciona',
    detalle: 'Un error, una pantalla que no carga o un número que no cuadra.',
    icono:
      'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  },
];

function Icono({ d }: { readonly d: string }) {
  return (
    <span className={s.opcionIcono}>
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
    </span>
  );
}

/**
 * «¿Qué necesitas?» (P-48, board `RpAyuda`): the first thing «Escríbele al
 * equipo» asks, as two cards. Radix supplies the radio group's arrow keys and
 * `aria-checked`.
 */
export function QueNecesitas(p: {
  readonly value: Que | null;
  readonly onChange: (que: Que) => void;
}) {
  const id = useId();
  return (
    <div className={s.grupo}>
      <span id={id} className={s.pregunta}>
        ¿Qué necesitas?
      </span>
      <RadioGroup.Root
        className={s.opciones}
        // Always controlled: `''` matches no card, so nothing starts chosen.
        value={p.value ?? ''}
        onValueChange={(value) => p.onChange(value === 'falla' ? 'falla' : 'duda')}
        aria-labelledby={id}
      >
        {OPCIONES.map((o) => (
          <RadioGroup.Item key={o.value} value={o.value} className={s.opcion}>
            <Icono d={o.icono} />
            <span className={s.opcionTexto}>
              <span className={s.opcionTitulo}>{o.titulo}</span>
              <span className={s.opcionDetalle}>{o.detalle}</span>
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
