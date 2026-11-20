/**
 * What the escáner shows after each code (MvEscaner, EcDuplicado; ADR-150):
 * the product it added (with «Deshacer»), a code the catalogue does not have
 * (with «Darlo de alta»), a code two or more products share (nothing goes on
 * the ticket until the operator taps one), the undo done, or the hint.
 */
import { productosPorCodigo, type ProductoCobrar } from './cobrar-catalogo';

export type EstadoEscaner =
  | { readonly tipo: 'listo' }
  | {
      readonly tipo: 'agregado';
      readonly p: ProductoCobrar;
      /** Chosen from a shared code with a product waiting in Revisión de caja. */
      readonly avisaDueno: boolean;
    }
  | { readonly tipo: 'desconocido'; readonly codigo: string }
  | {
      readonly tipo: 'duplicado';
      readonly codigo: string;
      readonly opciones: readonly ProductoCobrar[];
    }
  | { readonly tipo: 'deshecho'; readonly p: ProductoCobrar };

export type EstadoDuplicado = Extract<EstadoEscaner, { tipo: 'duplicado' }>;
export type EstadoAgregado = Extract<EstadoEscaner, { tipo: 'agregado' }>;

/** One code read against the catalogue. Only «agregado» puts something on the ticket. */
export function estadoDeCodigo(
  productos: readonly ProductoCobrar[],
  codigo: string,
): Exclude<EstadoEscaner, { tipo: 'listo' } | { tipo: 'deshecho' }> {
  const leido = codigo.trim();
  const opciones = productosPorCodigo(productos, leido);
  const [unico] = opciones;
  if (unico === undefined) return { tipo: 'desconocido', codigo: leido };
  if (opciones.length === 1) return { tipo: 'agregado', p: unico, avisaDueno: false };
  return { tipo: 'duplicado', codigo: leido, opciones };
}

/**
 * The operator tapped one of a shared code's products. The owner only sees the
 * duplicate in Revisión de caja while one of them is still waiting there, so
 * the escáner promises it only then.
 */
export function elegidoDeDuplicado(e: EstadoDuplicado, p: ProductoCobrar): EstadoAgregado {
  return { tipo: 'agregado', p, avisaDueno: e.opciones.some((o) => o.pendiente) };
}
