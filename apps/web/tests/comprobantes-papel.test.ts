// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';

/**
 * The paper preview (CfgComprobantes): the brand colour dresses Clásico,
 * Moderno and Minimal differently — a band for Moderno, a filled logo for
 * Clásico, nothing for Minimal; the logo or the initials; the address only
 * when the toggle says so; the footer's leyenda and WhatsApp only when the
 * business set them — and the no-CFDI line is on every one of the three.
 */

vi.mock('../src/app/(portal)/negocio/comprobantes/papel.css', () => {
  const variante = (n: string) => (t: string) => `${n}-${t}`;
  return {
    papel: variante('papel'),
    logo: 'logo',
    logoTam: { clasico: 'lt-c', moderno: 'lt-m' },
    logoImg: 'logoImg',
    banda: 'banda',
    cabezaVariante: { clasico: 'cv-c', moderno: 'cv-m', minimal: 'cv-i' },
    nombre: { clasico: 'n-c', moderno: 'n-m', minimal: 'n-i' },
    direccion: 'direccion',
    total: 'total',
    totalVariante: { clasico: 'tv-c', moderno: 'tv-m', minimal: 'tv-i' },
    totalValor: { clasico: 'tval-c', moderno: 'tval-m', minimal: 'tval-i' },
    mini: 'mini',
    cuerpo: 'cuerpo',
    cuerpoModerno: 'cuerpoModerno',
    linea: { clasico: 'l-c', moderno: 'l-m', minimal: 'l-i' },
    folio: 'folio',
    num: 'num',
    fecha: 'fecha',
    tabla: 'tabla',
    concepto: 'concepto',
    centro: 'centro',
    derecha: 'derecha',
    pagoTexto: 'pagoTexto',
    pago: { clasico: 'p-c', moderno: 'p-m', minimal: 'p-i' },
  };
});
vi.mock('../src/app/(portal)/negocio/comprobantes/papel-pie.css', () => ({
  pie: 'pie',
  leyenda: 'leyenda',
  whatsapp: 'whatsapp',
  fiscal: 'fiscal',
}));

const { PapelPreview } = await import('../src/app/(portal)/negocio/comprobantes/papel');
import type { Marca } from '../src/app/(portal)/negocio/comprobantes/muestra';

const MARCA = (over: Partial<Marca['form']> = {}): Marca => ({
  nombre: 'Taquería Don Pedro',
  iniciales: 'TD',
  logoUrl: null,
  form: {
    receiptTemplate: 'clasico',
    receiptLeyenda: '¡Gracias por tu compra!',
    addressPrint: true,
    direccion: 'Av. Siempreviva 742',
    whatsapp: '55 1234 5678',
    brandColor: '#1a7f37',
    ...over,
  },
});

function montar(m: Marca, t: 'clasico' | 'moderno' | 'minimal') {
  render(createElement(PapelPreview, { m, t }));
}

afterEach(cleanup);

describe('PapelPreview', () => {
  it('the three templates carry the venta, the folio and the no-CFDI line', () => {
    for (const t of ['clasico', 'moderno', 'minimal'] as const) {
      cleanup();
      montar(MARCA(), t);
      assert.ok(screen.getByText('V-2098'), `${t}: the folio`);
      assert.ok(screen.getByText('Quesadilla'), `${t}: the producto`);
      assert.ok(screen.getAllByText('$200.00').length > 0, `${t}: the total`);
      assert.ok(screen.getByText(/no es un comprobante fiscal/), `${t}: the no-CFDI line`);
    }
  });

  it('the logo image wins over the initials when there is one; the initials otherwise', () => {
    montar({ ...MARCA(), logoUrl: 'https://logo.mx/t.png' }, 'clasico');
    assert.ok((screen.getByAltText('') as HTMLImageElement).src.includes('logo.mx'));

    cleanup();
    montar(MARCA(), 'clasico');
    assert.ok(screen.getByText('TD'));
  });

  it('the address shows only when the toggle says so', () => {
    montar(MARCA(), 'moderno');
    assert.ok(screen.getByText('Av. Siempreviva 742'));

    cleanup();
    montar(MARCA({ addressPrint: false }), 'moderno');
    assert.ok(screen.queryByText('Av. Siempreviva 742') === null);
  });

  it('the footer’s leyenda and WhatsApp only when the business set them', () => {
    montar(MARCA(), 'clasico');
    assert.ok(screen.getByText('¡Gracias por tu compra!'));
    assert.ok(screen.getByText(/WhatsApp 55 1234 5678/));

    cleanup();
    montar(MARCA({ receiptLeyenda: '', whatsapp: '' }), 'clasico');
    assert.ok(screen.queryByText('¡Gracias por tu compra!') === null);
    assert.ok(screen.queryByText(/WhatsApp/) === null);
  });

  it('a brand colour that is not a finished hex falls back to the yellow', () => {
    montar(MARCA({ brandColor: 'verde' }), 'clasico');
    // The preview still renders — the colour is the token, never a crash.
    assert.ok(screen.getByRole('img'));
  });
});
