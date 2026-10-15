import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { PeriodoCerradoError, PlantillaInvalidaError } from '@xangarro/domain/corp';

import {
  dejarDeRepetir,
  PlantillaDesconocidaError,
  RecurrenteYaRegistradoError,
  registrarRecurrente,
  RevertirMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '../../src/corp/index.js';
import { FakeLedger } from './fake-ledger.js';
import { FakePlantillas } from './fake-recurrentes.js';

/**
 * E-02's recurring expenses (board CD-03): «Hacer recurrente cada mes» makes a
 * template of the charge just captured, and a later month's suggestion is
 * registered against it, once per month.
 */
const vercel: RegistrarMovimientoInput = {
  fecha: '2026-09-28',
  projectId: 'xangarro',
  concepto: ' Vercel ',
  contraparte: 'Vercel Inc.',
  founderId: 'f1',
  source: 'manual',
  sourceRef: 'manual-N1',
  usd: { montoOriginal: 20_00n, tipoCambio: '18.42' },
  deducible: true,
  movement: {
    kind: 'gasto',
    categoria: 'costo_servicio',
    subtotal: 368_40n,
    iva: 0n,
    tratamientoIva: 'exento',
    retencionIsr: 0n,
    retencionIva: 0n,
    pagado: true,
  },
};

function setup() {
  const ledger = new FakeLedger();
  return { ledger, plantillas: new FakePlantillas(ledger) };
}

const nueva = { tipo: 'nueva', id: 'rec-N1' } as const;

describe('registrarRecurrente: a new template from a capture', () => {
  it('registers the charge and keeps a template with its amount, day and month', async () => {
    const deps = setup();
    const { entry, plantilla } = await registrarRecurrente(deps, {
      movimiento: vercel,
      nonce: 'manual-N1',
      plantilla: nueva,
    });
    assert.equal(entry.source, 'recurring');
    assert.equal(entry.sourceRef, 'rec-N1:2026-09:manual-N1');
    assert.deepEqual(
      [
        plantilla.nombre,
        plantilla.moneda,
        plantilla.montoEstimado,
        plantilla.diaCargo,
        plantilla.desde,
      ],
      ['Vercel', 'USD', 20_00n, 28, '2026-09'],
    );
    assert.equal(plantilla.projectId, 'xangarro');
    assert.equal((await deps.plantillas.registradasEn('2026-09')).get('rec-N1'), entry.id);
  });

  it('keeps the MXN total, IVA included, as the estimate of a peso charge', async () => {
    const deps = setup();
    const { plantilla } = await registrarRecurrente(deps, {
      movimiento: {
        ...vercel,
        usd: null,
        movement: { ...vercel.movement, subtotal: 3_017_24n, iva: 482_76n },
      },
      nonce: 'manual-N1',
      plantilla: nueva,
    });
    assert.equal(plantilla.moneda, 'MXN');
    assert.equal(plantilla.montoEstimado, 3_500_00n);
  });

  it('lands a double submit on the same entry and the same template', async () => {
    const deps = setup();
    const input = { movimiento: vercel, nonce: 'manual-N1', plantilla: nueva };
    const a = await registrarRecurrente(deps, input);
    const b = await registrarRecurrente(deps, input);
    assert.equal(a.entry.id, b.entry.id);
    assert.equal(deps.ledger.entries.length, 1);
    assert.equal(deps.plantillas.plantillas.length, 1);
  });

  it('refuses to repeat anything but an expense', async () => {
    const deps = setup();
    await assert.rejects(
      registrarRecurrente(deps, {
        movimiento: {
          ...vercel,
          usd: null,
          movement: { kind: 'comision_bancaria', monto: 50_00n },
        },
        nonce: 'manual-N1',
        plantilla: nueva,
      }),
      PlantillaInvalidaError,
    );
    assert.equal(deps.ledger.entries.length, 0);
  });

  it('keeps no template when the charge itself is refused', async () => {
    const deps = setup();
    await assert.rejects(
      registrarRecurrente(deps, {
        movimiento: { ...vercel, fecha: '2026-08-28' },
        nonce: 'manual-N1',
        plantilla: nueva,
      }),
      PeriodoCerradoError,
    );
    assert.equal(deps.plantillas.plantillas.length, 0);
  });
});

describe('registrarRecurrente: a suggestion of an existing template', () => {
  async function conPlantilla() {
    const deps = setup();
    await registrarRecurrente(deps, { movimiento: vercel, nonce: 'manual-N1', plantilla: nueva });
    return deps;
  }
  const octubre = { ...vercel, fecha: '2026-10-28', sourceRef: 'manual-N2' };
  const existente = { tipo: 'existente', id: 'rec-N1', mes: '2026-10' } as const;

  it('registers October against the template', async () => {
    const deps = await conPlantilla();
    const { entry } = await registrarRecurrente(deps, {
      movimiento: octubre,
      nonce: 'manual-N2',
      plantilla: existente,
    });
    assert.equal(entry.sourceRef, 'rec-N1:2026-10:manual-N2');
    assert.equal((await deps.plantillas.registradasEn('2026-10')).get('rec-N1'), entry.id);
  });

  it('counts an October charge paid on 1 November for October', async () => {
    const deps = await conPlantilla();
    const { entry } = await registrarRecurrente(deps, {
      movimiento: { ...octubre, fecha: '2026-11-01' },
      nonce: 'manual-N2',
      plantilla: existente,
    });
    assert.equal(entry.fecha, '2026-11-01');
    assert.ok((await deps.plantillas.registradasEn('2026-10')).has('rec-N1'));
  });

  it('refuses a second charge for a month already registered', async () => {
    const deps = await conPlantilla();
    await registrarRecurrente(deps, {
      movimiento: octubre,
      nonce: 'manual-N2',
      plantilla: existente,
    });
    await assert.rejects(
      registrarRecurrente(deps, {
        movimiento: { ...octubre, sourceRef: 'manual-N3' },
        nonce: 'manual-N3',
        plantilla: existente,
      }),
      RecurrenteYaRegistradoError,
    );
  });

  it('lets a reversed month be registered again', async () => {
    const deps = await conPlantilla();
    const { entry } = await registrarRecurrente(deps, {
      movimiento: octubre,
      nonce: 'manual-N2',
      plantilla: existente,
    });
    await new RevertirMovimientoUseCase(deps.ledger).execute({
      entryId: entry.id,
      fecha: '2026-10-29',
      motivo: 'Monto equivocado',
      founderId: 'f1',
    });
    const again = await registrarRecurrente(deps, {
      movimiento: { ...octubre, sourceRef: 'manual-N3' },
      nonce: 'manual-N3',
      plantilla: existente,
    });
    assert.notEqual(again.entry.id, entry.id);
  });

  it('refuses a template that does not exist', async () => {
    const deps = setup();
    await assert.rejects(
      registrarRecurrente(deps, {
        movimiento: octubre,
        nonce: 'manual-N2',
        plantilla: { tipo: 'existente', id: 'rec-nada', mes: '2026-10' },
      }),
      PlantillaDesconocidaError,
    );
  });
});

describe('dejarDeRepetir', () => {
  it('stops a template and keeps what it already registered', async () => {
    const deps = setup();
    await registrarRecurrente(deps, { movimiento: vercel, nonce: 'manual-N1', plantilla: nueva });
    await dejarDeRepetir(deps.plantillas, 'rec-N1');
    assert.equal((await deps.plantillas.findById('rec-N1'))?.activo, false);
    assert.equal(deps.ledger.entries.length, 1);
  });

  it('refuses a template that does not exist', async () => {
    await assert.rejects(dejarDeRepetir(setup().plantillas, 'rec-nada'), PlantillaDesconocidaError);
  });
});
