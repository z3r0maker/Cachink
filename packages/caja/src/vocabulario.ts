import type { DiscrepancyReason, ExpenseCategory } from '@xangarro/domain';

import type { MotivoDiferencia } from './cierre/types';
import type { CategoriaGasto } from './gastos/types';

/**
 * The operator's words → the domain's stored values, for the register runtime
 * to write with (O-06). Provisional decisions D4 and D6 (ADR-083): the screen
 * keeps the handoff's labels; the record keeps the domain's enum, and the
 * operator's own label travels in the note.
 */
const CATEGORIA: Record<CategoriaGasto, ExpenseCategory> = {
  Insumos: 'Materia Prima',
  Servicios: 'Servicios',
  Transporte: 'Logística',
  Mantenimiento: 'Mantenimiento',
  Otros: 'Otro',
};

export const categoriaDominio = (c: CategoriaGasto): ExpenseCategory => CATEGORIA[c];

/** The inverse, for reads: what the operator's screen calls a stored category.
 *  Total for the register's own rows — it writes through `categoriaDominio`. */
const ETIQUETA: Record<ExpenseCategory, CategoriaGasto> = {
  'Materia Prima': 'Insumos',
  Servicios: 'Servicios',
  Logística: 'Transporte',
  Mantenimiento: 'Mantenimiento',
  Otro: 'Otros',
  // Categories the register never writes; the screen says «Otros» for them.
  Inventario: 'Otros',
  Nómina: 'Otros',
  Renta: 'Otros',
  Publicidad: 'Otros',
  Impuestos: 'Otros',
};
export const categoriaOperador = (c: ExpenseCategory): CategoriaGasto => ETIQUETA[c];

/**
 * Four close-out reasons onto six stored values. `gasto-no-registrado` has no
 * reason on the close (the expense screen captures those); the enum mixes cause
 * and direction, so «Venta no registrada» and «Otra razón» resolve by whether
 * cash was short or over (the note carries the operator's own words).
 */
export function motivoDominio(m: MotivoDiferencia, tipo: 'falta' | 'sobra'): DiscrepancyReason {
  switch (m) {
    case 'Cambio mal dado':
      return 'error-en-cambio';
    case 'Salió un vale':
      return 'retiro-autorizado';
    case 'Venta no registrada':
    case 'Otra razón':
      return tipo === 'sobra' ? 'sobrante' : 'otro';
  }
}
