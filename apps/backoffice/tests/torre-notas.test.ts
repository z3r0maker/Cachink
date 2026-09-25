import { describe, expect, it } from 'vitest';

import { campanasNota, pasos } from '@/app/(consola)/campanas/embudo';
import { mapaNota } from '@/app/(consola)/mapa/nota';
import type { AttributionView } from '@/server/attribution/list';
import type { GeoStateRow, GeoView } from '@/server/geo/list';
import { METRICS } from '@/server/geo/metrics';

const row = (nombre: string, value: number | null) =>
  ({ code: nombre, nombre, value }) as GeoStateRow;

const geo = (p: Partial<GeoView>): GeoView =>
  ({
    metric: METRICS.visitas,
    rango: '30d',
    rows: [],
    national: 0,
    sinEstado: 0,
    fueraDeMexico: 0,
    sinEstadoShare: 0,
    ...p,
  }) as GeoView;

describe('mapaNota', () => {
  it('names the leader and the runner-up', () => {
    const n = mapaNota(geo({ rows: [row('Jalisco', 2), row('Chihuahua', 23), row('Sonora', 0)] }));
    expect(n.text).toMatch(/^Chihuahua va a la cabeza con 23 visitas\. Jalisco le sigue con 2\./);
    expect(n.text).toContain('2 de 32 estados');
  });

  it('says so when nothing happened', () => {
    expect(mapaNota(geo({})).text).toContain('Ni sus luces');
  });

  it('raises the alarm when the location stopped arriving', () => {
    expect(mapaNota(geo({ sinEstadoShare: 0.5 })).mood).toBe('alarma');
  });

  it('waits for enough visits before talking conversion', () => {
    const n = mapaNota(geo({ metric: METRICS.conversion, rows: [row('Jalisco', null)] }));
    expect(n.mood).toBe('tranquilo');
  });
});

describe('campañas', () => {
  const view = (p: Partial<AttributionView>) =>
    ({ rango: '30d', rows: [], total: 0, directTotal: 0, ...p }) as AttributionView;

  it('rates each funnel step against the one before', () => {
    expect(pasos({ visitas: 25, checkouts: 1, altas: 1 }).map((p) => p.rate)).toEqual([
      null,
      4,
      100,
    ]);
    expect(pasos({ visitas: 0, checkouts: 0, altas: 0 })[1]?.rate).toBeNull();
  });

  it('credits the campaign that brought the most', () => {
    const n = campanasNota(
      view({
        total: 3,
        directTotal: 1,
        rows: [
          { campaign: 'Directo', source: '', medium: '', signups: 1, topRegion: '', direct: true },
          {
            campaign: 'fb-sep',
            source: 'fb',
            medium: 'cpc',
            signups: 2,
            topRegion: '',
            direct: false,
          },
        ],
      }),
    );
    expect(n.text).toBe(
      '3 altas en estos 30 días, 1 sin campaña. La que más trajo: «fb-sep», con 2.',
    );
  });

  it('has a line for a quiet period', () => {
    expect(campanasNota(view({})).text).toMatch(/^Ninguna alta/);
  });
});
