/**
 * «Registrar gasto»'s form (MvGastos' sheet; the web's `gastos/registrar.tsx`):
 * the amount typed on the keypad (Abrir turno's rules: digits, one point, two
 * decimals, parsed to centavos without a float), what was bought, one of the
 * five categories and, optionally, who was paid. A due recurring gasto opens
 * it filled. Pure.
 */
import type { CategoriaGasto, NuevoGasto, PrefillGasto } from '@xangarro/caja/gastos';
import {
  centavosDe,
  fondoDe,
  teclearFondo,
  type FondoEstado,
  type TeclaFondo,
} from '../AbrirTurno/fondo';

export interface GastoForm {
  readonly monto: FondoEstado;
  readonly concepto: string;
  readonly categoria: CategoriaGasto | null;
  readonly proveedor: string;
  readonly recurrenteId: string | null;
}

export function formInicial(prefill: PrefillGasto | null): GastoForm {
  if (prefill === null) {
    return {
      monto: fondoDe(null),
      concepto: '',
      categoria: null,
      proveedor: '',
      recurrenteId: null,
    };
  }
  return {
    monto: fondoDe(prefill.monto),
    concepto: prefill.concepto,
    categoria: prefill.categoria,
    proveedor: prefill.proveedor ?? '',
    recurrenteId: prefill.recurrenteId,
  };
}

export const teclear = (f: GastoForm, t: TeclaFondo): GastoForm => ({
  ...f,
  monto: teclearFondo(f.monto, t),
});

/** The amount in centavos, or null while it is not a positive amount. */
export function montoDe(f: GastoForm): bigint | null {
  const c = centavosDe(f.monto.raw);
  return c !== null && c > 0n ? c : null;
}

/** What is still missing, in the order the sheet asks; null when it can be saved. */
export function faltante(f: GastoForm): string | null {
  if (montoDe(f) === null) return 'Escribe cuánto fue.';
  if (f.concepto.trim() === '') return 'Escribe qué compraste.';
  if (f.categoria === null) return 'Elige una categoría.';
  return null;
}

export function nuevoDe(f: GastoForm): NuevoGasto | null {
  const monto = montoDe(f);
  if (monto === null || f.categoria === null || f.concepto.trim() === '') return null;
  const proveedor = f.proveedor.trim();
  return {
    monto,
    concepto: f.concepto.trim().slice(0, 200),
    categoria: f.categoria,
    proveedor: proveedor === '' ? null : proveedor.slice(0, 120),
    foto: null,
    ...(f.recurrenteId === null ? {} : { recurrenteId: f.recurrenteId }),
  };
}
