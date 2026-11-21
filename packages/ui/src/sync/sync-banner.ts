/**
 * The strip under the caja's header (N-22, board AtBanners, approved
 * 2026-11-20): red when the portal refused something, amber while there is
 * no internet, grey when nothing reached the portal in more than 3 days.
 * One at a time, in that order; none when everything is sent. Each is
 * tappable: red and amber open Registros por enviar, grey sends now.
 */
import type { CloudSyncState } from './cloud-sync-status';

export type TonoBanner = 'rojo' | 'ambar' | 'gris';

export interface BannerSync {
  readonly tono: TonoBanner;
  readonly titulo: string;
  readonly cuerpo: string;
  /** What a tap does: open Registros por enviar, or send now. */
  readonly accion: 'pendientes' | 'enviar';
  readonly testID: string;
}

/** More than this without a successful send turns the grey banner on. */
const UMBRAL_MS = 72 * 3_600_000;
const DIA_MS = 24 * 3_600_000;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;

const dos = (n: number): string => String(n).padStart(2, '0');

function rojo(n: number): BannerSync {
  const uno = n === 1;
  return {
    tono: 'rojo',
    titulo: uno ? '1 registro no se envió' : `${n} registros no se enviaron`,
    cuerpo: `El portal no ${uno ? 'lo' : 'los'} aceptó. Toca para ver qué pasó.`,
    accion: 'pendientes',
    testID: 'sync-banner-rechazados',
  };
}

function ambar(n: number): BannerSync {
  return {
    tono: 'ambar',
    titulo: 'Sin internet',
    cuerpo:
      n > 0
        ? `Sigue cobrando. ${n} por enviar; se envían solos al volver.`
        : 'Sigue cobrando. Todo se guarda en esta caja y se envía solo.',
    accion: 'pendientes',
    testID: 'offline-banner',
  };
}

function gris(ultima: Date, ahora: number): BannerSync {
  const dias = Math.floor((ahora - ultima.getTime()) / DIA_MS);
  const cuando = `${DIAS[ultima.getDay()]} ${ultima.getDate()} a las ${dos(ultima.getHours())}:${dos(ultima.getMinutes())}`;
  return {
    tono: 'gris',
    titulo: `Sin enviar desde hace ${dias} ${dias === 1 ? 'día' : 'días'}`,
    cuerpo: `Lo último llegó al portal el ${cuando}. Toca para enviar ahora.`,
    accion: 'enviar',
    testID: 'sync-banner-sin-enviar',
  };
}

export function bannerSync(state: CloudSyncState, ahora: number = Date.now()): BannerSync | null {
  if (state.counts.rejected > 0) return rojo(state.counts.rejected);
  if (state.phase === 'offline') return ambar(state.counts.pending + state.counts.retrying);
  if (state.lastSyncAt === null) return null;
  const ultima = new Date(state.lastSyncAt);
  return ahora - ultima.getTime() > UMBRAL_MS ? gris(ultima, ahora) : null;
}
