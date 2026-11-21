/**
 * The device's half of the business logo (N-19): where the copy lives and
 * how it is fetched. The app supplies both from its file system and its
 * network stack; the use case only decides when to call them.
 */

/** The logo as the phone holds it for offline receipts. */
export interface LogoGuardado {
  /** The synced `businesses.logoUrl` it was fetched from. */
  readonly url: string;
  /** The server's ETag for these bytes (their hash): the cache's key. */
  readonly etag: string;
  /** The business row's `updatedAt` it was last checked against. */
  readonly revision: string;
  readonly mime: string;
  /** The bytes, base64. */
  readonly base64: string;
}

/** One copy at a time: a new logo replaces the old one. */
export interface LogoCache {
  /** The copy held, or null when there is none (or it cannot be read). */
  leer(): Promise<LogoGuardado | null>;
  guardar(logo: LogoGuardado): Promise<void>;
  borrar(): Promise<void>;
}

/** What the server answered a conditional GET with. */
export type RespuestaLogo =
  | { readonly cambio: false }
  | {
      readonly cambio: true;
      readonly etag: string;
      readonly mime: string;
      readonly base64: string;
    };

export interface LogoDescarga {
  /**
   * GET `url`, sending `etagPrevio` as `If-None-Match` when there is one.
   * Rejects on a network failure or any status other than 200 and 304.
   */
  descargar(url: string, etagPrevio: string | null): Promise<RespuestaLogo>;
}
