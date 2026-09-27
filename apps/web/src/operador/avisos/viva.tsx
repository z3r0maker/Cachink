'use client';

/**
 * Avisos for real (O-16, ADR-075): a linked caja reads the owner's messages
 * to its operator (pulled into `mensajes_operador`), persists read marks on
 * the device, and writes each reply through `respuestas_operador`, which the
 * outbox carries to the owner. «De tu caja» comes from the caja's real state:
 * the queue, refused rows and low stock. An unlinked browser keeps the design.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { registerRuntime } from '../runtime/client';
import { hoyLocal } from '@xangarro/caja';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { desencolar } from '../shell/cola';
import { AvisosScreen } from './screen';
import { avisarCambio } from './sin-leer';
import {
  type AvisoGrupo,
  type AvisosData,
  type AvisosScreenProps,
  type AvisosVivo,
  avisosVivos,
  DUENO_GENERICO,
} from '@xangarro/caja/avisos';

type Estado = AvisosScreenProps['state'];

interface Vivo {
  readonly state: Estado;
  readonly data: AvisosData;
}

const VACIO: AvisosData = { dueno: DUENO_GENERICO, avisos: [] };

async function leerAvisos(cred: Credenciales): Promise<Vivo> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const a = await registerRuntime().avisos(device.businessId, device.deviceId, sesion.userId);
  const data = avisosVivos(a, hoyLocal());
  return { state: data.avisos.length === 0 ? 'empty' : 'happy', data };
}

function acciones(cred: Credenciales): AvisosVivo {
  return {
    marcar: (ids) => {
      if (ids.length === 0) return;
      void registerRuntime()
        .avisosLeidos(ids)
        .then(avisarCambio)
        .catch(() => undefined);
    },
    responder: async (mensajeId, texto) => {
      const { device, sesion } = cred;
      if (device === null || sesion === null) throw new Error('sin sesión');
      await registerRuntime().responderAviso({
        businessId: device.businessId,
        deviceId: device.deviceId,
        userId: sesion.userId,
        mensajeId,
        texto,
      });
      avisarCambio();
      if (navigator.onLine) void desencolar();
    },
  };
}

export function AvisosViva({
  fixture,
  forzado = 'happy',
  tab,
}: {
  readonly fixture: AvisosData;
  readonly forzado?: Estado;
  readonly tab: AvisoGrupo;
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  // Under the gate a linked caja renders on the client only: start at
  // «loading», never at the fixture.
  const [vivo, setVivo] = useState<Vivo>(() =>
    linked ? { state: 'loading', data: VACIO } : { state: 'happy', data: fixture },
  );
  const vivas = useMemo(() => acciones(cred), [cred]);

  useEffect(() => {
    if (!linked) return;
    setVivo((v) => ({ ...v, state: 'loading' }));
    void leerAvisos(cred)
      .then(setVivo)
      .catch(() => setVivo((v) => ({ ...v, state: 'error' })));
  }, [cred, linked]);

  if (!linked) return <AvisosScreen state={forzado} data={fixture} tab={tab} />;
  return <AvisosScreen state={vivo.state} data={vivo.data} tab={tab} vivo={vivas} />;
}
