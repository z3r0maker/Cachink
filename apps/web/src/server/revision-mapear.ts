/**
 * Revisión de caja's row mappers (O-37): the raw pendientes plus their
 * context become the screen's rows — sale counts, fiado, the duplicate.
 */

import type { ClientePendiente, ProductoPendiente } from './revision';

const TINTES = ['#FFD60A', '#3B6FFF', '#00C896', '#8B5CF6', '#06B6D4'] as const;

const dia = (iso: string): string =>
  new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(iso));

/** The raw pendientes as the screen's rows. */
export function mapearProductos(
  productos: readonly {
    id: string;
    nombre: string;
    precio: bigint;
    creado: string;
  }[],
  ventas: Map<string, { n: number; monto: bigint }>,
  dups: Map<string, { id: string; nombre: string }>,
): readonly ProductoPendiente[] {
  return productos.map((p, i) => {
    const v = ventas.get(p.id) ?? { n: 0, monto: 0n };
    const dup = dups.get(p.nombre.toLowerCase());
    return {
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      detalle: `Creado en caja · ${dia(p.creado)} · vendido ${v.n} ${v.n === 1 ? 'vez' : 'veces'}`,
      tint: TINTES[i % TINTES.length] ?? '#FFD60A',
      pareceA: dup?.nombre ?? null,
      pareceAId: dup?.id ?? null,
    } satisfies ProductoPendiente;
  });
}

export function mapearClientes(
  filas: readonly {
    id: string;
    nombre: string;
    telefono: string | null;
    creado: string;
  }[],
  fiado: Map<string, bigint>,
  dups: Map<string, { id: string; nombre: string }>,
): readonly ClientePendiente[] {
  return filas.map((c, i) => {
    const dup = dups.get(c.nombre.toLowerCase());
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono ?? '',
      fiado: fiado.get(c.id) ?? 0n,
      detalle: `Creado en caja · ${dia(c.creado)}`,
      tint: TINTES[(i + 2) % TINTES.length] ?? '#FFD60A',
      pareceA: dup?.nombre ?? null,
      pareceAId: dup?.id ?? null,
    } satisfies ClientePendiente;
  });
}
