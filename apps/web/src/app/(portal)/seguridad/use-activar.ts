'use client';

import { useState, useTransition } from 'react';

import { activarVerificacion, prepararActivacion } from '@/server/actions/seguridad';

/** Board SgActivar: the password, the QR and its first code, the recovery codes. */
export type Paso = 'clave' | 'escanear' | 'codigos';

export interface Falla {
  readonly texto: string;
  /** The field at fault; none for a lock or an outage, which get a banner. */
  readonly campo?: 'password' | 'codigo' | undefined;
  readonly bloqueado: boolean;
}

interface Semilla {
  /** SVG `data:` URI, rendered on the server. */
  readonly qr: string;
  /** The same seed, grouped in fours for typing. */
  readonly clave: string;
}

type Refused = {
  readonly message: string;
  readonly campo?: 'password' | 'codigo';
  readonly bloqueado?: true;
};

const falla = (r: Refused): Falla => ({
  texto: r.message,
  campo: r.bloqueado ? undefined : r.campo,
  bloqueado: r.bloqueado === true,
});

/** What the panel holds between steps. Closing it forgets all of it. */
function useDatos() {
  const [paso, setPaso] = useState<Paso>('clave');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [semilla, setSemilla] = useState<Semilla | null>(null);
  const [codigos, setCodigos] = useState<readonly string[]>([]);
  const reiniciar = () => {
    setPaso('clave');
    setPassword('');
    setCodigo('');
    setSemilla(null);
    setCodigos([]);
  };
  return {
    ...{ paso, setPaso, password, setPassword, codigo, setCodigo },
    ...{ semilla, setSemilla, codigos, setCodigos, reiniciar },
  };
}

/**
 * Turning the second factor on, one step at a time. The seed and the codes
 * live only in this hook's state: closing the panel forgets them, and the
 * codes are never fetched again.
 */
export function useActivar() {
  const d = useDatos();
  const [error, setError] = useState<Falla | null>(null);
  const [pending, startTransition] = useTransition();

  const confirmarClave = () =>
    startTransition(async () => {
      const r = await prepararActivacion(d.password);
      if (!r.ok) return setError(falla(r));
      d.setSemilla({ qr: r.qr, clave: r.clave });
      d.setPassword('');
      setError(null);
      d.setPaso('escanear');
    });
  const activar = () =>
    startTransition(async () => {
      const r = await activarVerificacion(d.codigo);
      if (!r.ok) return setError(falla(r));
      d.setCodigos(r.codigos);
      setError(null);
      d.setPaso('codigos');
    });
  const escribir = (set: (v: string) => void) => (v: string) => {
    set(v);
    setError((e) => (e?.bloqueado ? e : null));
  };
  return {
    ...{ paso: d.paso, password: d.password, codigo: d.codigo, semilla: d.semilla },
    ...{ codigos: d.codigos, error, pending, confirmarClave, activar },
    reiniciar: () => {
      d.reiniciar();
      setError(null);
    },
    setPassword: escribir(d.setPassword),
    setCodigo: escribir(d.setCodigo),
    atras: () => d.setPaso('clave'),
  };
}

export type Activando = ReturnType<typeof useActivar>;
