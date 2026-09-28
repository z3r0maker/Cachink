/**
 * Where a snapshot bootstrap stands (DS-10): «Descargando los datos de tu
 * negocio… 3 de 7» on the caja's «Conectar esta caja» and the phone's
 * activation. Kept in `app_config`, written by `applyPulledPage` in the same
 * transaction as the page, so a snapshot resumed in a later run still knows
 * its place and a page that fails to apply moves nothing.
 */

import type { AppConfigRepository } from '@xangarro/data';
import type { PulledPage } from './page-applier.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

type Writes = Record<string, string | null>;

export interface SnapshotProgress {
  /** Pages applied so far, 1-based. */
  readonly pagina: number;
  /**
   * The first page's estimate, never below `pagina` (a page's byte budget
   * can cut more pages than the estimate); null from an older server.
   */
  readonly paginas: number | null;
}

type ConfigReader = Pick<AppConfigRepository, 'get'>;

/** The progress writes for `page`, given what the device stored before it. */
export async function progressWrites(cfg: ConfigReader, page: PulledPage): Promise<Writes> {
  const s = page.snapshot;
  if (s === undefined) return {};
  if (s.next === null) {
    return { [SYNC_CONFIG_KEYS.bootstrapPage]: null, [SYNC_CONFIG_KEYS.bootstrapPages]: null };
  }
  const antes = s.first ? 0 : Number((await cfg.get(SYNC_CONFIG_KEYS.bootstrapPage)) ?? 0) || 0;
  const estimado = s.first ? s.pages : Number(await cfg.get(SYNC_CONFIG_KEYS.bootstrapPages));
  return {
    [SYNC_CONFIG_KEYS.bootstrapPage]: String(antes + 1),
    [SYNC_CONFIG_KEYS.bootstrapPages]:
      estimado !== undefined && Number.isInteger(estimado) && estimado > 0
        ? String(estimado)
        : null,
  };
}

/** Where the open snapshot stands, or null when none is in progress. */
export async function snapshotProgress(cfg: ConfigReader): Promise<SnapshotProgress | null> {
  const pagina = Number(await cfg.get(SYNC_CONFIG_KEYS.bootstrapPage));
  if (!Number.isInteger(pagina) || pagina < 1) return null;
  const estimado = Number(await cfg.get(SYNC_CONFIG_KEYS.bootstrapPages));
  return {
    pagina,
    paginas: Number.isInteger(estimado) && estimado > 0 ? Math.max(estimado, pagina) : null,
  };
}
