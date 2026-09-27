'use client';

import type { ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import * as a from './acceso.css';
import { AvisoVinculacion } from './aviso-vinculacion';
import * as v from './vincular.css';

const CORREO =
  'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 3-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7';

function Paso(p: { readonly n: number; readonly hecho: boolean; readonly children: ReactNode }) {
  return (
    <li className={v.paso}>
      <span className={v.numero} data-hecho={p.hecho} aria-hidden="true">
        {p.n}
      </span>
      {p.children}
    </li>
  );
}

function Correo(p: { readonly email: string; readonly onEmail: (s: string) => void }) {
  return (
    <div className={v.cuerpo}>
      <label htmlFor="vincular-correo" className={v.etiqueta}>
        Correo del dueño
      </label>
      <div className={v.campo}>
        <Icon path={CORREO} size={20} strokeWidth={2} />
        <input
          id="vincular-correo"
          type="email"
          autoComplete="off"
          className={v.input}
          placeholder="pedro@taqueria.mx"
          data-testid="vincular-correo"
          value={p.email}
          onChange={(e) => p.onEmail(e.target.value)}
        />
      </div>
    </div>
  );
}

function estadoCaja(i: number, codigo: string, error: boolean): string {
  if (error) return 'error';
  if (codigo[i]) return 'lleno';
  return i === codigo.length ? 'siguiente' : 'vacio';
}

function Cajas(p: { readonly desde: number; readonly codigo: string; readonly error: boolean }) {
  return [0, 1, 2, 3].map((k) => {
    const i = p.desde + k;
    return (
      <span
        key={i}
        className={v.caja}
        data-estado={estadoCaja(i, p.codigo, p.error)}
        aria-hidden="true"
      >
        {p.codigo[i] ?? ''}
      </span>
    );
  });
}

/** The real input lies invisible over the eight boxes. */
function CodigoCajas(p: {
  readonly codigo: string;
  readonly hayError: boolean;
  readonly onCodigo: (s: string) => void;
}): ReactNode {
  const hayError = p.hayError;
  return (
    <div className={v.codigo}>
      <Cajas desde={0} codigo={p.codigo} error={hayError} />
      <span className={v.punto} aria-hidden="true">
        ·
      </span>
      <Cajas desde={4} codigo={p.codigo} error={hayError} />
      <input
        id="vincular-codigo"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className={v.codigoInput}
        aria-describedby="vincular-codigo-ayuda"
        aria-invalid={hayError}
        data-testid="vincular-codigo"
        value={p.codigo}
        onChange={(e) => p.onCodigo(e.target.value)}
      />
    </div>
  );
}

function Codigo(p: {
  readonly codigo: string;
  readonly error: string | null;
  readonly delCodigo: boolean;
  readonly onCodigo: (s: string) => void;
}) {
  const hayError = p.error !== null && p.delCodigo;
  return (
    <div className={v.cuerpo}>
      <div className={v.etiquetaFila}>
        <label htmlFor="vincular-codigo" className={v.etiqueta}>
          Código de 8 letras
        </label>
        <span className={v.cuenta}>{p.codigo.length} de 8</span>
      </div>
      <CodigoCajas codigo={p.codigo} hayError={hayError} onCodigo={p.onCodigo} />
      {p.error !== null ? (
        <p className={a.fallo} role="alert" data-testid="vincular-error">
          {p.error}
        </p>
      ) : null}
      <p id="vincular-codigo-ayuda" className={v.ayuda}>
        El dueño lo genera en su portal, en <b className={v.fuerte}>Equipo y nómina</b>. Vence en 48
        horas y sirve una sola vez. No importan mayúsculas, espacios ni guiones.
      </p>
    </div>
  );
}

/** Correo, código and the aviso: OpVincular's three numbered steps. */
export function Pasos(p: {
  readonly email: string;
  readonly codigo: string;
  readonly correoOk: boolean;
  readonly error: string | null;
  readonly delCodigo: boolean;
  readonly onEmail: (s: string) => void;
  readonly onCodigo: (s: string) => void;
}) {
  return (
    <ol className={v.pasos}>
      <Paso n={1} hecho={p.correoOk}>
        <Correo email={p.email} onEmail={p.onEmail} />
      </Paso>
      <Paso n={2} hecho={p.codigo.length === 8 && !(p.error !== null && p.delCodigo)}>
        <Codigo codigo={p.codigo} error={p.error} delCodigo={p.delCodigo} onCodigo={p.onCodigo} />
      </Paso>
      <Paso n={3} hecho={p.correoOk && p.codigo.length === 8}>
        <AvisoVinculacion />
      </Paso>
    </ol>
  );
}
