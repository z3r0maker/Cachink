import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { PlantillaRecurrente, RecurrenteDelMes } from '@xangarro/domain/corp';

import { cargosDeHoy, correoDe } from '../src/server/empresa/recordatorios';

/**
 * E-11, boards CD-06h and CD-01f: «si no llega, te recordamos pedirla». On
 * its day, a supplier who invoices every month and has not yet is in the
 * morning email as an invoice to ask for, not a charge to register.
 */
const contadora: PlantillaRecurrente = {
  id: 'rec-contadora',
  nombre: 'ANA LÓPEZ MARTÍNEZ',
  contraparte: 'ANA LÓPEZ MARTÍNEZ',
  rfc: 'LOMA800101AB2',
  categoria: 'administracion',
  moneda: 'MXN',
  montoEstimado: 3_336_67n,
  diaCargo: 3,
  projectId: null,
  deducible: true,
  activo: true,
  desde: '2026-10',
};
const vercel: PlantillaRecurrente = { ...contadora, id: 'rec-vercel', nombre: 'Vercel', rfc: null };

const del = (
  plantilla: PlantillaRecurrente,
  estado: RecurrenteDelMes['estado'],
): RecurrenteDelMes => ({
  plantilla,
  fecha: '2026-11-03',
  estado,
  entryId: null,
  facturaDel: null,
});

describe('the morning email asks for a missing invoice (CD-06h)', () => {
  it('picks a supplier whose invoice is missing today, apart from a charge to register', () => {
    const cargos = cargosDeHoy(
      [del(contadora, 'falta_factura'), del(vercel, 'sugerido')],
      '2026-11-03',
    );
    assert.deepEqual(cargos, [
      { nombre: 'ANA LÓPEZ MARTÍNEZ', monto: '$3,336.67', factura: true },
      { nombre: 'Vercel', monto: '$3,336.67', factura: false },
    ]);
  });

  it('says nothing on another day, or once the invoice came', () => {
    assert.deepEqual(cargosDeHoy([del(contadora, 'falta_factura')], '2026-11-04'), []);
    assert.deepEqual(cargosDeHoy([del(contadora, 'registrado')], '2026-11-03'), []);
  });

  it('asks for it by name, in the subject and in its own paragraph', () => {
    const solo = correoDe([], 'https://admin', [
      { nombre: 'ANA LÓPEZ MARTÍNEZ', monto: '$3,336.67', factura: true },
    ]);
    assert.equal(solo.subject, 'MEXIA: hoy toca pedir la factura de ANA LÓPEZ MARTÍNEZ');
    assert.deepEqual(solo.paragraphs, [
      'Hoy esperamos la factura de: ANA LÓPEZ MARTÍNEZ.',
      'Pídela y regístrala en Facturas: con ella el mes queda listo.',
    ]);
  });

  it('keeps a charge to register in its own words beside an invoice to ask for', () => {
    const ambos = correoDe([], 'https://admin', [
      { nombre: 'ANA LÓPEZ MARTÍNEZ', monto: '$3,336.67', factura: true },
      { nombre: 'Vercel', monto: 'USD 20.00', factura: false },
    ]);
    assert.deepEqual(ambos.paragraphs, [
      'Hoy toca registrar: Vercel (USD 20.00).',
      'Regístralo con el monto de tu estado de cuenta.',
      'Hoy esperamos la factura de: ANA LÓPEZ MARTÍNEZ.',
      'Pídela y regístrala en Facturas: con ella el mes queda listo.',
    ]);
  });
});
