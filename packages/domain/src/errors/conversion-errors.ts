/**
 * Typed errors for automatic conversion flow.
 *
 * Phase 9 of the Feature Flags plan: Conversión Automática.
 */

import type { ConversionReceta } from '../entities/conversion-receta.js';

/** Thrown when a sale requires a conversion (insufficient stock). */
export class ConversionRequiredError extends Error {
  readonly code = 'CONVERSION_REQUIRED' as const;

  constructor(
    readonly recipe: ConversionReceta,
    readonly materiaPrimaNombre: string,
    readonly cantidadResultante: number,
  ) {
    super('Conversion required');
    this.name = 'ConversionRequiredError';
  }
}

/** Thrown when materia prima is also insufficient for conversion. */
export class InsufficientMateriaPrimaError extends Error {
  readonly code = 'INSUFFICIENT_MATERIA_PRIMA' as const;

  constructor(readonly materiaPrimaNombre: string) {
    super(`No hay ${materiaPrimaNombre} disponible para convertir`);
    this.name = 'InsufficientMateriaPrimaError';
  }
}
