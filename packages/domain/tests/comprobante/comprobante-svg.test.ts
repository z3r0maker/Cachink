import assert from 'node:assert/strict';
import { describe, expect, it } from 'vitest';

import {
  comprobanteMinimalSvg,
  comprobanteModernoSvg,
  comprobanteSvg,
  comprobanteTicketSvg,
  type Comprobante,
} from '../../src/comprobante/index.js';
import { comprobanteClasicoSvg } from '../../src/comprobante/svg/clasico.js';

/**
 * The twelve artboards of «design-reference/comprobantes» as fixtures —
 * variant A (light accent, logo, full branding, 3 conceptos), B (dark
 * accent, no logo, one concepto), C (long name, optional blocks off).
 * The snapshots are the transcription contract: a change here is a design
 * change and says so in the commit.
 */

const LOGO =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#FFD60A"/><circle cx="40" cy="40" r="18" fill="#0D0D0D"/></svg>',
  ).toString('base64');

function base(overrides: Partial<Comprobante['negocio']>): Comprobante['negocio'] {
  return { nombre: 'Taquería Doña Cuca', acento: '#FFD60A', ...overrides };
}

const A: Comprobante = {
  negocio: base({
    logoDataUrl: LOGO,
    monograma: 'DC',
    direccion: 'Av. Hidalgo 214, Col. Centro · Guadalajara, Jal.',
    whatsapp: '33 1245 8890',
    redes: '@tacosdonacuca',
    leyenda: '¡Gracias por tu compra!',
  }),
  folio: 'V-000128',
  fechaHora: '2026-09-14T20:32:00Z',
  conceptos: [
    { concepto: 'Orden de tacos al pastor', cantidad: 3, importe: 18000n },
    { concepto: 'Refresco 600 ml', cantidad: 2, importe: 6000n },
    { concepto: 'Consomé chico', cantidad: 1, importe: 4500n },
  ],
  total: 28500n,
  metodoPago: 'Efectivo',
  mostrarMarcaXangarro: true,
};

const B: Comprobante = {
  negocio: {
    nombre: 'Plomería Lozano',
    monograma: 'PL',
    direccion: 'Servicio a domicilio · Zona metropolitana',
    whatsapp: '33 2210 7744',
    acento: '#14532D',
  },
  folio: 'V-000129',
  fechaHora: '2026-09-14T23:05:00Z',
  conceptos: [
    { concepto: 'Reparación de fuga y cambio de mezcladora', cantidad: 1, importe: 125000n },
  ],
  total: 125000n,
  metodoPago: 'Transferencia',
  mostrarMarcaXangarro: true,
};

const C: Comprobante = {
  negocio: {
    nombre: 'Abarrotes y Cremería La Michoacana de Don Rubén',
    monograma: 'AM',
    acento: '#FFD60A',
  },
  folio: 'V-000130',
  fechaHora: '2026-09-15T15:18:00Z',
  conceptos: [
    { concepto: 'Queso Cotija por kilo', cantidad: 2, importe: 34000n },
    { concepto: 'Crema natural 1 L', cantidad: 1, importe: 7800n },
  ],
  total: 41800n,
  metodoPago: 'Crédito',
  mostrarMarcaXangarro: false,
};

const VARIANTES: readonly [string, Comprobante][] = [
  ['A', A],
  ['B', B],
  ['C', C],
];

describe('comprobanteSvg (N-20): the twelve artboards', () => {
  for (const [nombre, c] of VARIANTES) {
    it(`Clásico ${nombre} matches the artboard`, () => {
      expect(comprobanteClasicoSvg(c)).toMatchSnapshot();
    });
    it(`Moderno ${nombre} matches the artboard`, () => {
      expect(comprobanteModernoSvg(c)).toMatchSnapshot();
    });
    it(`Ticket ${nombre} matches the artboard`, () => {
      expect(comprobanteTicketSvg(c)).toMatchSnapshot();
    });
    it(`Minimal ${nombre} matches the artboard`, () => {
      expect(comprobanteMinimalSvg(c)).toMatchSnapshot();
    });
  }
});

describe('comprobanteSvg (N-20): acceptance', () => {
  it('renders the same object in all four templates (handoff #1)', () => {
    for (const plantilla of ['clasico', 'moderno', 'ticket', 'minimal'] as const) {
      const svg = comprobanteSvg(plantilla, B);
      assert.ok(svg.startsWith('<svg'), `${plantilla} emits an svg`);
      assert.ok(svg.includes('V-000129'), `${plantilla} shows the folio`);
      assert.ok(svg.includes('$1,250.00'), `${plantilla} shows the total`);
    }
  });

  it('flips the total ink with the accent (handoff #3)', () => {
    const claro = comprobanteClasicoSvg({ ...B, negocio: { ...B.negocio, acento: '#FFD60A' } });
    const oscuro = comprobanteClasicoSvg(B);
    assert.match(claro, /fill="#0D0D0D"[^>]*>TOTAL MXN/);
    assert.match(oscuro, /fill="#FFFFFF"[^>]*>TOTAL MXN/);
  });

  it('keeps Minimal A6 height with one concepto or three (handoff #4)', () => {
    const alto = (svg: string): string => /height="(\d+)"/.exec(svg)?.[1] ?? '';
    const uno = comprobanteMinimalSvg(B);
    const tres = comprobanteMinimalSvg({ ...B, conceptos: A.conceptos, total: A.total });
    assert.equal(alto(uno), alto(tres));
    assert.equal(alto(uno), '616');
  });

  it('carries no fiscal field in any salida (handoff #5)', () => {
    const fiscales = ['UUID', 'folio fiscal', 'Sello', 'RFC', 'régimen', 'SAT '];
    for (const plantilla of ['clasico', 'moderno', 'ticket', 'minimal'] as const) {
      const svg = comprobanteSvg(plantilla, B);
      for (const campo of fiscales) {
        assert.equal(svg.includes(campo), false, `${plantilla} mentions ${campo}`);
      }
      assert.ok(svg.includes('no es un comprobante fiscal'), `${plantilla} keeps the legal line`);
    }
  });

  it('vanishes off blocks whole — content and all (handoff #4)', () => {
    const ticketCompleto = comprobanteTicketSvg(A);
    const ticketPelado = comprobanteTicketSvg(C);
    assert.ok(ticketCompleto.includes('WHATSAPP 33 1245 8890'));
    assert.equal(ticketPelado.includes('WHATSAPP'), false);
    assert.equal(ticketPelado.includes('Gracias por tu compra'), false);
    const clasicoPelado = comprobanteClasicoSvg(C);
    assert.equal(clasicoPelado.includes('WhatsApp'), false);
    assert.equal(clasicoPelado.includes('Gracias por tu compra'), false);
  });
});
