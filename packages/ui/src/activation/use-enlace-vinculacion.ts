/**
 * useEnlaceVinculacion — the pairing token a link opened the app with
 * (`xangarro://activar#c=<token>`, N-25), read like a scan: the link the
 * app was launched by, and every link that arrives while it is open.
 * Anything that is not a pairing link is ignored (`tokenDeQr`).
 *
 * The OS keeps answering the launch link for the life of the process, so
 * that one is handed over once: a phone unlinked later in the same session
 * does not reopen the sheet on a token it already used. A link opened again
 * while the app runs is a new read, even with the same token, so each read
 * is its own object.
 */

import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { tokenDeQr } from '../screens/Activation/activation-form';

export interface Enlace {
  readonly token: string;
}

export interface EstadoEnlaces {
  inicialEntregado: boolean;
}

const ESTADO: EstadoEnlaces = { inicialEntregado: false };

/** The read a link makes, or null: not a pairing link, or the launch link handed over already. */
export function enlaceDe(
  url: string | null,
  inicial: boolean,
  estado: EstadoEnlaces,
): Enlace | null {
  const token = url === null ? null : tokenDeQr(url);
  if (token === null || (inicial && estado.inicialEntregado)) return null;
  if (inicial) estado.inicialEntregado = true;
  return { token };
}

export function useEnlaceVinculacion(): Enlace | null {
  const [enlace, setEnlace] = useState<Enlace | null>(null);
  useEffect(() => {
    // Under StrictMode the first run is torn down before the launch link
    // answers: only a live run takes it, so the second one still gets it.
    let vivo = true;
    const tomar = (url: string | null, inicial: boolean): void => {
      const leido = vivo ? enlaceDe(url, inicial, ESTADO) : null;
      if (leido !== null) setEnlace(leido);
    };
    Linking.getInitialURL()
      .then((url) => tomar(url, true))
      .catch(() => undefined);
    const sub = Linking.addEventListener('url', ({ url }) => tomar(url, false));
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);
  return enlace;
}
