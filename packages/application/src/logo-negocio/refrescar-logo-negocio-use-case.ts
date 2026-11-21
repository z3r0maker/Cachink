/**
 * Keep the phone's copy of the business logo in step with the synced
 * `businesses.logoUrl` (N-19), so the comprobante shows it offline.
 *
 * The URL is stable across uploads (`/api/logos/<businessId>`), so a change
 * is read from the business row: its `updatedAt` is the revision. While the
 * revision is the one the copy was checked against, nothing touches the
 * network. When it moves, one conditional GET with the ETag held: a 304 (or
 * the same ETag) keeps the bytes; new bytes replace them. A failed or
 * unusable download keeps the copy held, and a removed logo clears it.
 */

import { esLogoAdmitido } from '@xangarro/domain';

import type { UseCase } from '../_use-case.js';
import type { LogoCache, LogoDescarga, LogoGuardado, RespuestaLogo } from './puertos.js';

export interface RefrescarLogoNegocioInput {
  /** The synced `businesses.logoUrl`; null when the business has none. */
  readonly logoUrl: string | null;
  /** The business row's `updatedAt`. */
  readonly revision: string;
}

export type EstadoLogo = 'vigente' | 'descargado' | 'sin-cambio' | 'sin-logo' | 'fallo';

export interface LogoRefrescado {
  /** The logo to draw, or null for the no-logo receipt. */
  readonly logo: LogoGuardado | null;
  readonly estado: EstadoLogo;
  /** Why the download failed, for the caller to log; set only with `fallo`. */
  readonly error?: unknown;
}

/** The download answered with something the upload would never have stored. */
class LogoNoAdmitidoError extends Error {
  readonly code = 'LOGO_NO_ADMITIDO';
  constructor(mime: string) {
    super(`The logo URL answered ${mime}, not a logo.`);
  }
}

export class RefrescarLogoNegocioUseCase implements UseCase<
  RefrescarLogoNegocioInput,
  LogoRefrescado
> {
  constructor(
    private readonly cache: LogoCache,
    private readonly descarga: LogoDescarga,
  ) {}

  async execute(input: RefrescarLogoNegocioInput): Promise<LogoRefrescado> {
    const previo = await this.cache.leer();
    if (input.logoUrl === null) {
      if (previo !== null) await this.cache.borrar();
      return { logo: null, estado: 'sin-logo' };
    }
    // A copy fetched from another URL is another business's: never shown.
    const propio = previo !== null && previo.url === input.logoUrl ? previo : null;
    if (propio !== null && propio.revision === input.revision) {
      return { logo: propio, estado: 'vigente' };
    }
    let respuesta: RespuestaLogo;
    try {
      respuesta = await this.descarga.descargar(input.logoUrl, propio?.etag ?? null);
      if (respuesta.cambio && !esLogoAdmitido(respuesta.mime, respuesta.base64)) {
        throw new LogoNoAdmitidoError(respuesta.mime);
      }
    } catch (error) {
      return { logo: propio, estado: 'fallo', error };
    }
    return this.guardar({ logoUrl: input.logoUrl, revision: input.revision }, propio, respuesta);
  }

  private async guardar(
    input: { readonly logoUrl: string; readonly revision: string },
    propio: LogoGuardado | null,
    respuesta: RespuestaLogo,
  ): Promise<LogoRefrescado> {
    if (propio !== null && (!respuesta.cambio || respuesta.etag === propio.etag)) {
      const al = { ...propio, revision: input.revision };
      await this.cache.guardar(al);
      return { logo: al, estado: 'sin-cambio' };
    }
    if (!respuesta.cambio) {
      // A 304 for an ETag never sent: the server is confused, nothing to keep.
      return { logo: null, estado: 'fallo', error: new LogoNoAdmitidoError('304') };
    }
    const nuevo: LogoGuardado = {
      url: input.logoUrl,
      etag: respuesta.etag,
      revision: input.revision,
      mime: respuesta.mime,
      base64: respuesta.base64,
    };
    await this.cache.guardar(nuevo);
    return { logo: nuevo, estado: 'descargado' };
  }
}
