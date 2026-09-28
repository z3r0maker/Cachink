'use client';

/**
 * Registros por enviar for real (O-27): a linked caja lists its own outbox
 * (what `desencolar()` pushes), sends it for real, and reads it again after
 * every send, so «Todo enviado» means the server has it. An unlinked browser
 * keeps the design's queue.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { registerRuntime } from '../runtime/client';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { primerNombreDueno, type EstadoMode } from '@xangarro/caja';
import { enviarYa, useCola } from '../shell/cola';
import { PendientesScreen } from './screen';
import { type EnvioVivo, type RegistroEnCola, comoRegistro } from '@xangarro/caja/pendientes';

interface Vivo {
  readonly state: 'happy' | EstadoMode;
  readonly cola: readonly RegistroEnCola[];
}

async function leerCola(): Promise<Vivo> {
  const cola = await registerRuntime().colaPendiente();
  return { state: 'happy', cola: cola.map(comoRegistro) };
}

/** The owner's first name as the last pull sent it; null: «el portal del dueño». */
function useDueno(cred: Credenciales): string | null {
  const [dueno, setDueno] = useState<string | null>(null);
  useEffect(() => {
    const { device } = cred;
    if (device === null || cred.sesion === null) return;
    void registerRuntime()
      .negocio(device.businessId, device.deviceId)
      .then((n) => setDueno(primerNombreDueno(n?.dueno)))
      .catch(() => undefined);
  }, [cred]);
  return dueno;
}

export function PendientesViva({
  fixture,
  forzado = 'happy',
}: {
  readonly fixture: readonly RegistroEnCola[];
  readonly forzado?: 'happy' | EstadoMode;
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const shell = useCola();
  const dueno = useDueno(cred);
  // Under the gate a linked caja renders on the client only: start at
  // «loading», never at the fixture.
  const [vivo, setVivo] = useState<Vivo>(() =>
    linked ? { state: 'loading', cola: [] } : { state: 'happy', cola: fixture },
  );

  const recargar = useCallback(
    (): Promise<void> =>
      leerCola()
        .then(setVivo)
        .catch(() => setVivo((v) => ({ ...v, state: 'error' }))),
    [],
  );
  useEffect(() => {
    if (!linked) return;
    setVivo((v) => ({ ...v, state: 'loading' }));
    void recargar();
  }, [linked, recargar]);
  // Anyone's flush (a sale, coming back online) changes the queue: read it again.
  useEffect(() => {
    if (linked && !shell.enviando) void recargar();
  }, [linked, shell.enviando, shell.pendientes, recargar]);

  const envio = useMemo<EnvioVivo>(
    () => ({
      listo: vivo.state === 'happy',
      // A person asked: past the engine's own wait, never the server's (DS-05).
      enviar: () => enviarYa().then(recargar),
    }),
    [vivo.state, recargar],
  );

  if (!linked) return <PendientesScreen state={forzado} cola={fixture} />;
  return <PendientesScreen state={vivo.state} cola={vivo.cola} dueno={dueno} vivo={envio} />;
}
