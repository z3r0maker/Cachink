import 'server-only';

import { avisoPublicado, AVISO_VERSION } from '@/legal/aviso-simplificado';
import { avisoDeVersion } from '@/server/legal/aviso';
import { estadoPrivacidadDe } from '@/server/privacidad/estado';

/**
 * What «Privacidad y mis datos» shows (PvPagina, ADR-137), for the session's
 * own account: the aviso it accepted and its exact text, the novedades choice,
 * and, when there is one, the aviso it has not accepted yet.
 */
export interface TextoDeAviso {
  /** `0.2-borrador`, as the ledger records it. */
  readonly version: string;
  readonly parrafos: readonly string[];
  /** The first 16 hex digits of its SHA-256, in groups of four. */
  readonly huella: string;
  readonly publicado: string;
  readonly cambios: string | null;
}

export interface PrivacidadData {
  readonly aceptado: { readonly at: string; readonly texto: TextoDeAviso | null } | null;
  readonly novedades: boolean;
  /** The current aviso, when the account has not accepted it. */
  readonly nuevo: TextoDeAviso | null;
  readonly dueno: boolean;
}

function texto(version: string): TextoDeAviso | null {
  const p = avisoPublicado(version);
  const a = avisoDeVersion(version);
  if (p === undefined || a === null) return null;
  const huella = a.sha256.slice(0, 16).replace(/(.{4})(?!$)/g, '$1 ');
  return { version, parrafos: p.parrafos, huella, publicado: p.publicado, cambios: p.cambios };
}

export async function loadPrivacidad(userId: string, dueno: boolean): Promise<PrivacidadData> {
  const e = await estadoPrivacidadDe(userId);
  return {
    aceptado: e.aceptado === null ? null : { at: e.aceptado.at, texto: texto(e.aceptado.version) },
    novedades: e.novedades,
    nuevo: e.avisoNuevo ? texto(AVISO_VERSION) : null,
    dueno,
  };
}
