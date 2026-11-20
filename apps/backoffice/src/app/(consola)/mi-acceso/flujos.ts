'use client';

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

import {
  agregarLlave,
  opcionesReconfirmar,
  prepararAgregar,
  quitarLlave,
  reconfirmar,
} from '@/server/actions/acceso';
import type { PublicKeyCredentialCreationOptionsJSON } from '@xangarro/auth-core';

/**
 * The client half of «Mi acceso» (board CD-20c): each flow drives the
 * browser's own prompt between two server actions and says what to show next.
 * The server decides whether a fresh tap is owed; these only follow it.
 */
export type Despues = 'agregar' | { readonly quitar: string; readonly nombre: string };

export type Siguiente =
  | { readonly kind: 'confirmar'; readonly despues: Despues }
  | { readonly kind: 'esperando' }
  | {
      readonly kind: 'aviso';
      readonly tono: 'ok' | 'aviso' | 'error';
      readonly titulo: string;
      readonly texto?: string;
    }
  | { readonly kind: 'listo' };

const NO_SE_GUARDO: Siguiente = {
  kind: 'aviso',
  tono: 'aviso',
  titulo: 'No se guardó la llave nueva.',
  texto: 'Cerraste la ventana, o ese equipo ya tiene una llave tuya.',
};

async function crear(options: PublicKeyCredentialCreationOptionsJSON): Promise<Siguiente> {
  let answer;
  try {
    answer = await startRegistration({ optionsJSON: options });
  } catch {
    return NO_SE_GUARDO;
  }
  const result = await agregarLlave(answer);
  if (result.kind === 'confirmar') return { kind: 'confirmar', despues: 'agregar' };
  if (result.kind === 'fallida') return NO_SE_GUARDO;
  return { kind: 'aviso', tono: 'ok', titulo: `Guardamos «${result.nombre}».` };
}

/** «Agregar llave»: straight to the browser if the last tap is fresh, else the re-ask first. */
export async function agregar(onEsperando: () => void): Promise<Siguiente> {
  const started = await prepararAgregar();
  if (started.kind === 'confirmar') return { kind: 'confirmar', despues: 'agregar' };
  onEsperando();
  return crear(started.options);
}

export async function quitar(id: string, nombre: string): Promise<Siguiente> {
  const outcome = await quitarLlave(id);
  if (outcome === 'confirmar') return { kind: 'confirmar', despues: { quitar: id, nombre } };
  if (outcome === 'ultima') {
    return {
      kind: 'aviso',
      tono: 'aviso',
      titulo: 'Es tu única llave: agrega otra antes de quitar esta.',
    };
  }
  if (outcome === 'no-existe') return { kind: 'listo' };
  return { kind: 'aviso', tono: 'ok', titulo: `Quitamos «${nombre}».` };
}

/** «Confirmar con mi llave»: one tap of one of your own passkeys, then what was asked. */
export async function confirmar(despues: Despues, onEsperando: () => void): Promise<Siguiente> {
  const options = await opcionesReconfirmar();
  let answer;
  try {
    answer = await startAuthentication({ optionsJSON: options });
  } catch {
    return { kind: 'aviso', tono: 'aviso', titulo: 'No se usó ninguna llave.' };
  }
  if (!(await reconfirmar(answer))) {
    return {
      kind: 'aviso',
      tono: 'error',
      titulo: 'Esa llave no es tuya.',
      texto: 'Toca una de las llaves de esta lista.',
    };
  }
  return despues === 'agregar' ? agregar(onEsperando) : quitar(despues.quitar, despues.nombre);
}
