'use client';

import { colors } from '@xangarro/tokens';

import * as m from '../ui/mostrador.css';
import * as c from './cancelar.css';

export const MOTIVOS = [
  'El cliente se arrepintió',
  'Me equivoqué al cobrar',
  'Cobré de más',
  'Otra razón',
] as const;
export type Motivo = (typeof MOTIVOS)[number];

/** «¿Por qué la cancelas?»: one of four, required. */
export function Motivos(p: {
  readonly value: Motivo | null;
  readonly onChange: (m: Motivo) => void;
}) {
  return (
    <div className={c.grupo}>
      <span id="cv-m" className={m.etiqueta}>
        ¿Por qué la cancelas?
      </span>
      <div role="radiogroup" aria-labelledby="cv-m" className={c.chips}>
        {MOTIVOS.map((x) => (
          <button
            key={x}
            type="button"
            role="radio"
            aria-checked={p.value === x}
            className={m.chipMarcado}
            onClick={() => p.onChange(x)}
          >
            {x}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Nota(p: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div className={c.grupo}>
      <label htmlFor="cv-nota" className={m.etiqueta}>
        Nota para Pedro <span className={m.opcional}>(opcional)</span>
      </label>
      <span className={m.campo}>
        <input
          id="cv-nota"
          type="text"
          className={m.campoInput}
          placeholder="Ej. pidió para llevar y ya no esperó"
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
          data-testid="cancelar-nota"
        />
      </span>
    </div>
  );
}

/** A linked register signs the cancellation with the operator's NIP (O-32). */
export function Nip(p: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div className={c.grupo}>
      <label htmlFor="cv-nip" className={m.etiqueta}>
        Tu NIP <span className={m.opcional}>(cuatro números)</span>
      </label>
      <span className={`${m.campo} ${c.nip}`}>
        <input
          id="cv-nip"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          className={`${m.campoInput} ${c.nipInput}`}
          value={p.value}
          onChange={(e) => p.onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          data-testid="cancelar-nip"
        />
      </span>
    </div>
  );
}

const ALERTA = [
  'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
  'M12 9v4',
  'M12 17h.01',
];

/** The consequence, in amber; a refused cancellation, in red. */
export function Aviso(p: { readonly texto: string; readonly error?: boolean }) {
  const color = p.error ? colors.redText : colors.warningText;
  return (
    <div className={p.error ? c.error : c.aviso} role={p.error ? 'alert' : undefined}>
      <span className={c.icono} style={{ color }}>
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
          {ALERTA.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </span>
      <span>{p.texto}</span>
    </div>
  );
}
