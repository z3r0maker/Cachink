import { colors } from '@xangarro/tokens';

import type { RevisionData } from '../../src/app/(portal)/revision-caja/types';

/**
 * `Revision de caja.dc.html`: four products and two credit clients waiting.
 *
 * **Test data only**, which is why it lives under `tests/`. It sat in `src/`
 * once, and `pendientes.ts` used its length as the sidebar's badge — so
 * production showed «Revisión de caja 6» above a page that read Postgres and
 * found nothing to review. The rows here exercise the pure `derive` helpers;
 * nothing the app ships may import them.
 */
export const REVISION_FIXTURE: RevisionData = {
  vendidoSinCosto: 2_840_00n,
  productos: [
    {
      id: 'p-tripa',
      nombre: 'Orden de tripa',
      precio: 95_00n,
      detalle: 'Ana Robledo · Caja 1 · hoy 13:20 · vendido 4 veces desde entonces',
      tint: colors.redSoft,
      pareceA: 'Taco de tripa',
    },
    {
      id: 'p-michelada',
      nombre: 'Michelada preparada',
      precio: 75_00n,
      detalle: 'Luis Ortega · Caja 2 · ayer 20:40 · vendido 11 veces',
      tint: colors.blueSoft,
    },
    {
      id: 'p-combo',
      nombre: 'Combo dos gringas y refresco',
      precio: 140_00n,
      detalle: 'Ana Robledo · Caja 1 · ayer 14:05 · vendido 6 veces',
      tint: colors.peachSoft,
      pareceA: 'Gringa',
    },
    {
      id: 'p-elote',
      nombre: 'Elote preparado',
      precio: 35_00n,
      detalle: 'Luis Ortega · Caja 2 · 12 may · vendido 3 veces',
      tint: colors.greenSoft,
    },
  ],
  clientes: [
    {
      id: 'c-chelo',
      nombre: 'Doña Chelo',
      telefono: '5566 210 884',
      fiado: 240_00n,
      detalle: 'Ana Robledo · Caja 1 · hoy 12:10 · fiado por $240.00',
      tint: colors.purpleSoft,
    },
    {
      id: 'c-raul',
      nombre: 'Raul obra',
      telefono: '5521 664 019',
      fiado: 180_00n,
      detalle: 'Luis Ortega · Caja 2 · ayer 19:30 · fiado por $180.00',
      tint: colors.yellowSoft,
      pareceA: 'Raúl (obra de la esquina)',
    },
  ],
};
