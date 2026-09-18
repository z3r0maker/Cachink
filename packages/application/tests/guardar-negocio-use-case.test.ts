import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { BusinessPatch } from '@xangarro/data';
import { NegocioInvalidoError, type Business, type BusinessId } from '@xangarro/domain';

import { GuardarNegocioUseCase, type GuardarNegocioInput } from '../src/guardar-negocio/index.js';

const ID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function repo() {
  const patches: BusinessPatch[] = [];
  return {
    patches,
    update: async (_id: BusinessId, patch: BusinessPatch) => {
      patches.push(patch);
      return {} as Business;
    },
  };
}

const valid: GuardarNegocioInput = {
  id: ID,
  nombre: ' Taquería Don Pedro ',
  regimenSat: '612',
  isrTasa: 3000,
  rfc: 'xoji740919u48',
  razonSocial: 'Pedro Pérez',
  codigoPostal: '06600',
  usoCfdi: 'G03',
  metodosPago: ['Tarjeta', 'Efectivo'],
  atributos: [{ label: 'Talla', opciones: ['Chica'], obligatorio: false }],
};

async function errorsOf(input: Partial<GuardarNegocioInput>) {
  const r = repo();
  const err = await new GuardarNegocioUseCase(r).execute({ ...valid, ...input }).then(
    () => null,
    (e: unknown) => e,
  );
  assert.ok(err instanceof NegocioInvalidoError);
  assert.equal(r.patches.length, 0, 'nothing is written');
  return err.errores;
}

describe('GuardarNegocioUseCase', () => {
  it('writes every section in one patch, normalised and derived', async () => {
    const r = repo();
    const out = await new GuardarNegocioUseCase(r).execute(valid);
    assert.deepEqual(out, { warnings: [] });
    assert.deepEqual(r.patches, [
      {
        nombre: 'Taquería Don Pedro',
        regimenSat: '612',
        regimenFiscal: 'Otro',
        isrTasa: 3000,
        rfc: 'XOJI740919U48',
        razonSocial: 'Pedro Pérez',
        codigoPostal: '06600',
        usoCfdi: 'G03',
        enabledPaymentMethods: '["Efectivo","Tarjeta"]',
        atributosProducto: [
          {
            clave: 'talla',
            label: 'Talla',
            tipo: 'select',
            opciones: ['Chica'],
            obligatorio: false,
          },
        ],
      },
    ]);
  });

  it('leaves an unset régimen unset', async () => {
    const r = repo();
    await new GuardarNegocioUseCase(r).execute({ ...valid, regimenSat: null });
    assert.equal('regimenSat' in (r.patches[0] ?? {}), false);
  });

  it('refuses a blank name and an unknown régimen together', async () => {
    const e = await errorsOf({ nombre: '  ', regimenSat: '999' });
    assert.equal(e.campos.nombre, 'El negocio necesita un nombre.');
    assert.ok(e.campos.regimen);
  });

  it('refuses a mistyped RFC and a fractional ISR rate', async () => {
    const e = await errorsOf({ rfc: 'XOJI740919U47', isrTasa: 12.5 });
    assert.ok(e.campos.rfc);
    assert.ok(e.campos.isrTasa);
  });

  it('refuses no payment method, and points at a bad attribute row', async () => {
    const e = await errorsOf({
      metodosPago: [],
      atributos: [{ label: '', opciones: [], obligatorio: false }],
    });
    assert.ok(e.campos.metodosPago);
    assert.deepEqual(e.atributos, { 0: 'Escribe el nombre del atributo.' });
  });
});
