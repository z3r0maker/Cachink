'use client';

/**
 * Detalle de cliente for real (O-33): the account comes from the register's
 * own database; the fixture path stays for an unlinked browser. The shell's
 * business strings stay fixture-flavored until O-38 lifts the demo flag.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { useCredenciales, type Credenciales } from '../../runtime/use-credenciales';
import { comoCuenta, hoyLocal, leerCuentas } from '../vivo';
import { DetalleClienteScreen } from './screen';
import type { DetalleClienteData, DetalleClienteProps } from './types';
import type { EstadoMode } from '../../estado';
import type { CuentaCliente } from './types';

type Carga =
  | { readonly state: 'happy'; readonly cuenta: CuentaCliente | null }
  | { readonly state: EstadoMode };

/** A linked register's account for one client; fixture until linked (O-33). */
function useCuentaViva(cred: Credenciales, linked: boolean, clienteId: string): Carga {
  const [carga, setCarga] = useState<Carga>({ state: 'happy', cuenta: null });
  useEffect(() => {
    if (!linked) return;
    setCarga({ state: 'loading' });
    void leerCuentas(cred)
      .then((rows) => {
        const encontrada = rows.find((c) => c.id === clienteId);
        setCarga({
          state: 'happy',
          cuenta: encontrada === undefined ? null : comoCuenta(encontrada, hoyLocal()),
        });
      })
      .catch(() => setCarga({ state: 'error' }));
  }, [cred, linked, clienteId]);
  return carga;
}

export function DetalleClienteViva({
  clienteId,
  fixture,
  forzado = 'happy',
}: {
  readonly clienteId: string;
  readonly fixture: DetalleClienteData;
  readonly forzado?: DetalleClienteProps['state'];
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const carga = useCuentaViva(cred, linked, clienteId);

  const base = {
    negocio: fixture.negocio,
    dueno: fixture.dueno,
    hoy: linked ? hoyLocal() : fixture.hoy,
    vinculado: linked,
  };
  if (!linked) {
    return (
      <DetalleClienteScreen
        state={forzado}
        data={{ ...base, hoy: fixture.hoy, cuenta: fixture.cuenta }}
      />
    );
  }
  return (
    <DetalleClienteScreen
      state={carga.state}
      data={{ ...base, cuenta: carga.state === 'happy' ? carga.cuenta : null }}
    />
  );
}
