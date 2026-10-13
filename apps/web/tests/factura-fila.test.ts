// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { Factura } from '@xangarro/application/cfdi';

/**
 * One payment and its CFDI (ADR-070): timbrada downloads PDF/XML for those
 * who may write; a manual emission shows its UUID; En factura global offers
 * a nominative one when the fiscal data is complete — or points to Negocio
 * when it is not; Pendiente says it arrives by email; and a failed download
 * lands as a note, not a broken click.
 */

const urlDescargaFactura = vi.fn();
const solicitarFacturaNominal = vi.fn();
const clics: { href: string; download: string }[] = [];

vi.mock('@/server/billing/facturas', () => ({
  urlDescargaFactura: (...a: unknown[]) => urlDescargaFactura(...a),
  solicitarFacturaNominal: (...a: unknown[]) => solicitarFacturaNominal(...a),
}));
vi.mock('next/link', () => ({
  default: (p: { readonly href: string; readonly children: unknown }) =>
    createElement('a', { href: p.href }, p.children),
}));
vi.mock('../src/app/(portal)/suscripcion/facturas.css', () => ({
  fila: 'fila',
  fecha: 'fecha',
  concepto: 'concepto',
  total: 'total',
  estado: 'estado',
  acciones: 'acciones',
  accionNota: 'accionNota',
  tono: { timbrada: 't', en_global: 'g', pendiente: 'p', reembolso: 'r' },
}));
vi.mock('../src/app/(portal)/suscripcion/suscripcion.css', () => ({
  btn: { quieto: 'quieto', secundario: 'secundario' },
}));
vi.mock('../src/app/(portal)/suscripcion/fecha', () => ({
  fechaLarga: () => '12 de mayo de 2026',
  mesLargo: () => 'mayo',
}));

const { FacturaFila } = await import('../src/app/(portal)/suscripcion/factura-fila');

const TIMBRADA = {
  paymentId: 'pi-1',
  paidAt: '2026-05-12',
  totalCentavos: 299_00n,
  estado: 'timbrada',
  pdfDisponible: true,
  xmlDisponible: true,
  puedeSolicitarNominal: false,
  emitidaManual: false,
  cfdiUuid: null,
} as unknown as Factura;

const PERMISOS = { owner: true, mayWrite: true, fiscalCompleto: true };

function montar(fa: Factura, permisos = PERMISOS) {
  render(createElement(FacturaFila, { fa, ...permisos } as never));
}

beforeEach(() => {
  vi.clearAllMocks();
  clics.length = 0;
  // descargar() news an anchor and clicks it; capture instead of navigating.
  const original = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    const el = original(tag);
    if (tag === 'a') {
      Object.defineProperty(el, 'click', {
        value: () => clics.push({ href: el.getAttribute('href') ?? '', download: el.download }),
      });
    }
    return el;
  }) as never);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FacturaFila · the row', () => {
  it('the payment’s date, month, total and estado', () => {
    montar(TIMBRADA);
    assert.ok(screen.getByText('12 de mayo de 2026'));
    assert.ok(screen.getByText('Tu plan · mayo'));
    assert.ok(screen.getByText('$299.00'));
    assert.ok(screen.getByText('Timbrada'));
  });

  it('a manual emission shows «Emitida» with its UUID, not the stored estado', () => {
    montar({ ...TIMBRADA, emitidaManual: true, cfdiUuid: 'ABC-123' } as Factura);
    assert.ok(screen.getByText('Emitida'));
    assert.ok(screen.getByText(/UUID ABC-123/));
    assert.ok(screen.queryByText('Timbrada') === null);
  });

  it('pendiente says it arrives by email', () => {
    montar({
      ...TIMBRADA,
      estado: 'pendiente',
      pdfDisponible: false,
      xmlDisponible: false,
    } as Factura);
    assert.ok(screen.getByText(/Tu factura se enviará a tu correo/));
  });
});

describe('FacturaFila · the actions', () => {
  it('a writer downloads PDF and XML by format; a failed download says so', async () => {
    urlDescargaFactura.mockResolvedValueOnce({ ok: true, url: '/f.pdf', filename: 'factura.pdf' });
    montar(TIMBRADA);
    fireEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }));
    await waitFor(() => assert.deepEqual(clics, [{ href: '/f.pdf', download: 'factura.pdf' }]));
    assert.deepEqual(urlDescargaFactura.mock.calls, [['pi-1', 'pdf']]);

    urlDescargaFactura.mockResolvedValueOnce({ ok: false, message: 'El archivo expiró.' });
    fireEvent.click(screen.getByRole('button', { name: /Descargar XML/ }));
    await waitFor(() => assert.ok(screen.getByText('El archivo expiró.')));
  });

  it('a read-only role gets no download buttons', () => {
    montar(TIMBRADA, { ...PERMISOS, mayWrite: false });
    assert.ok(screen.queryByRole('button', { name: /Descargar/ }) === null);
  });

  it('en_global with complete fiscal data offers the nominative one; the server’s answer lands', async () => {
    solicitarFacturaNominal.mockResolvedValue({ ok: true });
    montar({
      ...TIMBRADA,
      estado: 'en_global',
      pdfDisponible: false,
      xmlDisponible: false,
      puedeSolicitarNominal: true,
    } as Factura);
    fireEvent.click(screen.getByRole('button', { name: /Solicitar factura a mi nombre/ }));
    await waitFor(() => assert.ok(screen.getByText(/te la enviamos a tu correo/)));

    solicitarFacturaNominal.mockResolvedValueOnce({ ok: false, message: 'Ya hay una solicitud.' });
    fireEvent.click(screen.getByRole('button', { name: /Solicitar factura a mi nombre/ }));
    await waitFor(() => assert.ok(screen.getByText('Ya hay una solicitud.')));
  });

  it('en_global with incomplete fiscal data points to Negocio instead', () => {
    montar(
      {
        ...TIMBRADA,
        estado: 'en_global',
        pdfDisponible: false,
        xmlDisponible: false,
        puedeSolicitarNominal: true,
      } as Factura,
      { ...PERMISOS, fiscalCompleto: false },
    );
    const aviso = screen.getByText(/Completa tus datos fiscales/);
    assert.equal(aviso.closest('a')?.getAttribute('href'), '/negocio');
    assert.ok(screen.queryByRole('button', { name: /Solicitar factura/ }) === null);
  });

  it('a non-owner never sees the nominative offer', () => {
    montar(
      {
        ...TIMBRADA,
        estado: 'en_global',
        pdfDisponible: false,
        xmlDisponible: false,
        puedeSolicitarNominal: true,
      } as Factura,
      { ...PERMISOS, owner: false },
    );
    assert.ok(screen.queryByText(/Solicitar factura/) === null);
    assert.ok(screen.queryByText(/Completa tus datos fiscales/) === null);
  });
});
