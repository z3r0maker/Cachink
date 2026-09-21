import { describe, expect, it } from 'vitest';

import type { InformeMensual } from '../src/generar-informe-mensual/generar-informe-mensual-use-case.js';
import { buildInformeMensualPdf } from '../src/generar-informe-mensual/build-pdf.js';

const LOGO =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#FFD60A"/></svg>',
  ).toString('base64');

/** Zeroed statement — the layout, not the numbers, is what this exercises. */
const INFORME: InformeMensual = {
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7TEM',
  yearMonth: '2026-09',
  estadoResultados: {
    ingresos: 0n,
    costoDeVentas: 0n,
    utilidadBruta: 0n,
    gastosOperativos: 0n,
    utilidadOperativa: 0n,
    isr: 0n,
    utilidadNeta: 0n,
  },
  ventasPorCategoria: {},
  egresosPorCategoria: {},
} as unknown as InformeMensual;

describe('buildInformeMensualPdf (P-34 + N-19 tail: the logo)', () => {
  it('renders with and without the business logo', async () => {
    const sinLogo = new Uint8Array(
      await (await buildInformeMensualPdf(INFORME, 'Taquería Doña Cuca')).arrayBuffer(),
    );
    expect(sinLogo.slice(0, 4)).toEqual(new TextEncoder().encode('%PDF'));

    const conLogo = new Uint8Array(
      await (await buildInformeMensualPdf(INFORME, 'Taquería Doña Cuca', LOGO)).arrayBuffer(),
    );
    expect(conLogo.slice(0, 4)).toEqual(new TextEncoder().encode('%PDF'));
    // The embedded logo makes the document strictly bigger.
    expect(conLogo.length).toBeGreaterThan(sinLogo.length);
  });
});
