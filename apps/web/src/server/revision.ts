/**
 * Revisión de caja's read (O-37): the products and clients an operator
 * created at the counter (`estado_revision = 'pendiente'`, ADR-074 §2) with
 * their facts — sales of each unreviewed product, fiado of each client — and
 * the likely duplicate offered for a merge (an approved record with the same
 * name).
 */

import { and, eq, isNull, ne } from 'drizzle-orm';
import {
  clientPayments,
  clients,
  pendienteDeRevision,
  products,
  sales,
  tickets,
} from '@xangarro/data-pg';

import { mapearClientes, mapearProductos } from './revision-mapear';
import { withTenant, type Tx } from './db';

/** The screen's rows, in centavos. */
export interface ProductoPendiente {
  readonly id: string;
  readonly nombre: string;
  readonly precio: bigint;
  readonly detalle: string;
  readonly tint: string;
  readonly pareceA: string | null;
  readonly pareceAId: string | null;
}

export interface ClientePendiente {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string;
  readonly fiado: bigint;
  readonly detalle: string;
  readonly tint: string;
  readonly pareceA: string | null;
  readonly pareceAId: string | null;
}

export interface Pendientes {
  readonly productos: readonly ProductoPendiente[];
  readonly clientes: readonly ClientePendiente[];
  readonly vendidoSinCosto: bigint;
}

/** The closed turnos, newest first — see `cortes.ts` for that screen's read. */
export async function listarPendientes(businessId: string): Promise<Pendientes> {
  return withTenant(businessId, async (tx) => {
    const productos = await tx
      .select({
        id: products.id,
        nombre: products.nombre,
        precio: products.precioVentaCentavos,
        creado: products.createdAt,
      })
      .from(products)
      .where(pendienteDeRevision(products, businessId));
    const clientesRows = await tx
      .select({
        id: clients.id,
        nombre: clients.nombre,
        telefono: clients.telefono,
        creado: clients.createdAt,
      })
      .from(clients)
      .where(pendienteDeRevision(clients, businessId));

    const ctx = await leerContexto(tx, businessId, productos, clientesRows);
    const filasProductos = mapearProductos(productos, ctx.ventas, ctx.dupsProductos);
    const filasClientes = mapearClientes(clientesRows, ctx.fiado, ctx.dupsClientes);
    return {
      productos: filasProductos,
      clientes: filasClientes,
      vendidoSinCosto: filasProductos.reduce(
        (acc, p) => acc + (ctx.ventas.get(p.id)?.monto ?? 0n),
        0n,
      ),
    };
  });
}

/** Everything the mapping needs beyond the rows themselves. */
async function leerContexto(
  tx: Tx,
  businessId: string,
  productos: readonly { id: string }[],
  clientes: readonly { id: string }[],
) {
  const [ventas, dupsProductos, fiado, dupsClientes] = await Promise.all([
    ventasPorProducto(
      tx,
      businessId,
      productos.map((p) => p.id),
    ),
    duplicados(tx, products, businessId),
    fiadoPorCliente(
      tx,
      businessId,
      clientes.map((c) => c.id),
    ),
    duplicados(tx, clients, businessId),
  ]);
  return { ventas, dupsProductos, fiado, dupsClientes };
}

/** Sales count and total per pending product. */
async function ventasPorProducto(
  tx: Tx,
  businessId: string,
  ids: readonly string[],
): Promise<Map<string, { n: number; monto: bigint }>> {
  const m = new Map<string, { n: number; monto: bigint }>();
  if (ids.length === 0) return m;
  const filas = await tx
    .select({ producto: sales.productoId, monto: sales.monto })
    .from(sales)
    .where(eq(sales.businessId, businessId));
  for (const f of filas) {
    if (!ids.includes(f.producto)) continue;
    const prev = m.get(f.producto) ?? { n: 0, monto: 0n };
    m.set(f.producto, { n: prev.n + 1, monto: prev.monto + f.monto });
  }
  return m;
}

/** Approved records by lowercase name — the merge targets. */
async function duplicados(
  tx: Tx,
  table: typeof products | typeof clients,
  businessId: string,
): Promise<Map<string, { id: string; nombre: string }>> {
  const rows = await tx
    .select({ id: table.id, nombre: table.nombre })
    .from(table)
    .where(
      and(
        eq(table.businessId, businessId),
        ne(table.estadoRevision, 'pendiente'),
        isNull(table.deletedAt),
      ),
    );
  return new Map(rows.map((r) => [r.nombre.toLowerCase(), r]));
}

/** Each pending client's standing fiado: Crédito lines minus abonos. */
async function fiadoPorCliente(
  tx: Tx,
  businessId: string,
  ids: readonly string[],
): Promise<Map<string, bigint>> {
  const m = new Map<string, bigint>(ids.map((i) => [i, 0n]));
  if (ids.length === 0) return m;
  const lineas = await tx
    .select({ cliente: tickets.clienteId, monto: sales.monto })
    .from(tickets)
    .innerJoin(sales, eq(sales.ticketId, tickets.id))
    .where(
      and(
        eq(tickets.businessId, businessId),
        eq(tickets.metodo, 'Crédito'),
        isNull(tickets.deletedAt),
        isNull(tickets.cancelledAt),
      ),
    );
  for (const l of lineas) {
    if (l.cliente === null || !m.has(l.cliente)) continue;
    m.set(l.cliente, (m.get(l.cliente) ?? 0n) + l.monto);
  }
  const abonos = await tx
    .select({ cliente: clientPayments.clienteId, monto: clientPayments.montoCentavos })
    .from(clientPayments)
    .where(and(eq(clientPayments.businessId, businessId), isNull(clientPayments.deletedAt)));
  for (const a of abonos) {
    if (!m.has(a.cliente)) continue;
    m.set(a.cliente, (m.get(a.cliente) ?? 0n) - a.monto);
  }
  return m;
}
