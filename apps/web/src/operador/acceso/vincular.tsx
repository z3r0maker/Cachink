'use client';

import { useState, type ReactNode } from 'react';

import { activar, limpiarCodigo, type Vinculo } from './activar';
import * as a from './acceso.css';
import { Continuar } from './boton';
import * as b from './boton.css';
import { Marco } from './marco';
import { Pasos } from './vincular-campos';
import * as v from './vincular.css';

/**
 * Conecta esta caja (OpVincular). The owner's correo accompanies the code: it
 * is /activate's second factor, exactly as the phone's activation.
 */

export { limpiarCodigo, type Vinculo };

const CORREO_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function falta(correoOk: boolean, n: number): string {
  if (!correoOk) return 'Falta el correo del dueño.';
  const r = 8 - n;
  return `Falta${r === 1 ? '' : 'n'} ${r} letra${r === 1 ? '' : 's'} del código.`;
}

function Encabezado(): ReactNode {
  return (
    <div className={a.heading}>
      <span className={a.eyebrow}>Una sola vez · te toma un minuto</span>
      <h1 className={a.titulo}>Conecta esta caja</h1>
      <p className={a.lead}>
        Escribe los datos una sola vez: este navegador queda como caja de tu negocio.
      </p>
    </div>
  );
}

function Acciones(p: {
  readonly listo: boolean;
  readonly enviando: boolean;
  readonly falta: string;
  readonly onConectar: () => void;
}): ReactNode {
  return (
    <div className={v.acciones}>
      <Continuar
        listo={p.listo}
        ocupado={p.enviando}
        testId="vincular-continuar"
        describedBy={p.listo ? undefined : 'vincular-falta'}
        onClick={p.onConectar}
      >
        {p.enviando ? 'Conectando…' : 'Conectar esta caja'}
      </Continuar>
      {p.listo ? null : (
        <span id="vincular-falta" className={b.falta}>
          {p.falta}
        </span>
      )}
    </div>
  );
}

type ErrorVinculo = { readonly mensaje: string; readonly delCodigo: boolean } | null;

function useVincular(onVinculado: (r: Vinculo) => void) {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<ErrorVinculo>(null);
  const [enviando, setEnviando] = useState(false);
  const correoOk = CORREO_OK.test(email.trim());
  const listo = correoOk && codigo.length === 8;

  async function vincular(): Promise<void> {
    if (!listo || enviando) return;
    setEnviando(true);
    setError(null);
    const r = await activar(email.trim(), codigo);
    setEnviando(false);
    if (r.ok) onVinculado(r.vinculo);
    else setError({ mensaje: r.mensaje, delCodigo: r.delCodigo });
  }
  const onEmail = (x: string): void => {
    setEmail(x);
    setError(null);
  };
  const onCodigo = (x: string): void => {
    setCodigo(limpiarCodigo(x));
    setError(null);
  };
  return { email, codigo, error, enviando, correoOk, listo, vincular, onEmail, onCodigo };
}

export function Vincular(p: {
  readonly onVinculado: (r: Vinculo) => void;
  readonly pie?: ReactNode;
}) {
  const s = useVincular(p.onVinculado);
  return (
    <Marco
      pose="senalando"
      mensaje="Esta computadora todavía no es una caja. Vamos a conectarla."
      chip="Esta computadora"
      chipSub="sin conectar"
      vinculada={false}
    >
      <Encabezado />
      <Pasos
        email={s.email}
        codigo={s.codigo}
        correoOk={s.correoOk}
        error={s.error?.mensaje ?? null}
        delCodigo={s.error?.delCodigo ?? false}
        onEmail={s.onEmail}
        onCodigo={s.onCodigo}
      />
      <Acciones
        listo={s.listo}
        enviando={s.enviando}
        falta={falta(s.correoOk, s.codigo.length)}
        onConectar={() => void s.vincular()}
      />
      {p.pie}
    </Marco>
  );
}
