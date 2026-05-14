/**
 * Conversion error classes tests.
 */

import { describe, expect, it } from 'vitest';
import {
  ConversionRequiredError,
  InsufficientMateriaPrimaError,
} from '../../src/errors/conversion-errors.js';
import type { ConversionReceta } from '../../src/entities/conversion-receta.js';

const MOCK_RECIPE: ConversionReceta = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7RCP' as ConversionReceta['id'],
  materiaPrimaId: '01HZ8XQN9GZJXV8AKQ5X0C7MP1' as ConversionReceta['materiaPrimaId'],
  productoResultanteId: '01HZ8XQN9GZJXV8AKQ5X0C7PR1' as ConversionReceta['productoResultanteId'],
  cantidadOrigen: 10,
  cantidadResultante: 5,
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as ConversionReceta['businessId'],
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as ConversionReceta['deviceId'],
  createdByUserId: null,
  createdAt: '2026-04-23T15:00:00.000Z' as ConversionReceta['createdAt'],
  updatedAt: '2026-04-23T15:00:00.000Z' as ConversionReceta['updatedAt'],
  deletedAt: null,
};

describe('ConversionRequiredError', () => {
  it('has the correct code and message', () => {
    const err = new ConversionRequiredError(MOCK_RECIPE, 'Harina', 5);
    expect(err.code).toBe('CONVERSION_REQUIRED');
    expect(err.name).toBe('ConversionRequiredError');
    expect(err.message).toBe('Conversion required');
    expect(err).toBeInstanceOf(Error);
  });

  it('preserves recipe and metadata', () => {
    const err = new ConversionRequiredError(MOCK_RECIPE, 'Azúcar', 10);
    expect(err.recipe).toBe(MOCK_RECIPE);
    expect(err.materiaPrimaNombre).toBe('Azúcar');
    expect(err.cantidadResultante).toBe(10);
  });
});

describe('InsufficientMateriaPrimaError', () => {
  it('has the correct code and message', () => {
    const err = new InsufficientMateriaPrimaError('Harina');
    expect(err.code).toBe('INSUFFICIENT_MATERIA_PRIMA');
    expect(err.name).toBe('InsufficientMateriaPrimaError');
    expect(err.message).toBe('No hay Harina disponible para convertir');
    expect(err).toBeInstanceOf(Error);
  });

  it('includes the materia prima nombre', () => {
    const err = new InsufficientMateriaPrimaError('Leche');
    expect(err.materiaPrimaNombre).toBe('Leche');
  });
});
