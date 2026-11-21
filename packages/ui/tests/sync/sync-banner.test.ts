/**
 * The strip under the caja's header (N-22, board AtBanners): which banner
 * shows, in the board's order (red wins, then amber, then grey), and how
 * each says it. Nothing shows when everything is sent.
 */
import { describe, expect, it } from 'vitest';
import { bannerSync } from '../../src/sync/sync-banner';
import type { CloudSyncState } from '../../src/sync/cloud-sync-status';

const AHORA = new Date('2026-11-20T18:40:00').getTime();
const HACE = (horas: number): string => new Date(AHORA - horas * 3_600_000).toISOString();

function estado(
  over: Partial<CloudSyncState> & { rejected?: number; pending?: number },
): CloudSyncState {
  return {
    phase: over.phase ?? 'idle',
    counts: { pending: over.pending ?? 0, rejected: over.rejected ?? 0, retrying: 0, unsent: 0 },
    lastSyncAt: over.lastSyncAt === undefined ? HACE(1) : over.lastSyncAt,
  };
}

describe('bannerSync', () => {
  it('everything sent: no banner', () => {
    expect(bannerSync(estado({}), AHORA)).toBeNull();
  });

  it('offline: the amber one says to keep selling, with what waits', () => {
    expect(bannerSync(estado({ phase: 'offline', pending: 3 }), AHORA)).toEqual({
      tono: 'ambar',
      titulo: 'Sin internet',
      cuerpo: 'Sigue cobrando. 3 por enviar; se envían solos al volver.',
      accion: 'pendientes',
      testID: 'offline-banner',
    });
    expect(bannerSync(estado({ phase: 'offline' }), AHORA)?.cuerpo).toBe(
      'Sigue cobrando. Todo se guarda en esta caja y se envía solo.',
    );
  });

  it('refused rows: the red one wins, even offline, and opens Registros por enviar', () => {
    const b = bannerSync(estado({ phase: 'offline', rejected: 2, pending: 3 }), AHORA);
    expect(b).toEqual({
      tono: 'rojo',
      titulo: '2 registros no se enviaron',
      cuerpo: 'El portal no los aceptó. Toca para ver qué pasó.',
      accion: 'pendientes',
      testID: 'sync-banner-rechazados',
    });
    expect(bannerSync(estado({ rejected: 1 }), AHORA)).toMatchObject({
      titulo: '1 registro no se envió',
      cuerpo: 'El portal no lo aceptó. Toca para ver qué pasó.',
    });
  });

  it('more than 3 days without reaching the portal: the grey one says since when, and sends', () => {
    const martes = new Date('2026-11-17T18:30:00').toISOString();
    expect(bannerSync(estado({ lastSyncAt: martes }), AHORA)).toEqual({
      tono: 'gris',
      titulo: 'Sin enviar desde hace 3 días',
      cuerpo: 'Lo último llegó al portal el martes 17 a las 18:30. Toca para enviar ahora.',
      accion: 'enviar',
      testID: 'sync-banner-sin-enviar',
    });
  });

  it('72 hours is not yet more than 3 days, and a phone that never sent shows nothing grey', () => {
    expect(bannerSync(estado({ lastSyncAt: HACE(72) }), AHORA)).toBeNull();
    expect(bannerSync(estado({ lastSyncAt: null }), AHORA)).toBeNull();
  });

  it('offline beats grey: no internet says more than an old send', () => {
    expect(bannerSync(estado({ phase: 'offline', lastSyncAt: HACE(200) }), AHORA)?.tono).toBe(
      'ambar',
    );
  });
});
