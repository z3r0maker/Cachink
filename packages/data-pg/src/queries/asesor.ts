import { and, eq, isNull, notInArray, sql } from 'drizzle-orm';

import type { Insight } from '@xangarro/domain';
import { mesAnterior, type IsoDate } from '@xangarro/domain';

import { inventoryMovements, products } from '../schema/catalog.js';
import { expenses, sales, tickets } from '../schema/ledger.js';
import { notices } from '../schema/portal.js';
import { contarCapacidades, conteosAsesor } from './asesor-conteos.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The raw rows the Asesor's deterministic layer reads (P-26), in one tenant
 * pass. Windows follow the detectors' needs: ventas of the last two complete
 * months plus the current one, egresos of the current month plus the
 * three-month baseline, and full history for the capacidades counts.
 */
export async function asesorInputs(tx: Tx, hoy: IsoDate) {
  const desdeVentas = `${mesAnterior(hoy, 2)}-01`;
  const desdeEgresos = `${mesAnterior(hoy, 3)}-01`;

  const [ventas, egresos, entradas, catalogo, conteos] = await Promise.all([
    ventasRecientes(tx, desdeVentas),
    gastosRecientes(tx, desdeEgresos),
    entradasDeCompra(tx),
    inventarioYConteos(tx),
    conteosAsesor(tx, hoy),
  ]);

  return mapearInsightRows(hoy, ventas, egresos, entradas, catalogo, conteos);
}

/** Ventas of the window the quincena detector reads. */
function ventasRecientes(tx: Tx, desde: string) {
  return tx
    .select({ fecha: sales.fecha, monto: sales.monto, metodo: tickets.metodo })
    .from(sales)
    .innerJoin(tickets, eq(sales.ticketId, tickets.id))
    .where(
      and(
        isNull(sales.deletedAt),
        isNull(tickets.cancelledAt),
        sql`left(${sales.fecha}, 10) >= ${desde}`,
      ),
    );
}

/** Egresos of the window the baseline detector reads. */
function gastosRecientes(tx: Tx, desde: string) {
  return tx
    .select({
      id: expenses.id,
      fecha: expenses.fecha,
      concepto: expenses.concepto,
      categoria: expenses.categoria,
      monto: expenses.monto,
    })
    .from(expenses)
    .where(and(isNull(expenses.deletedAt), sql`left(${expenses.fecha}, 10) >= ${desde}`));
}

/** Every purchase entry — the cost-delta detector's history. */
function entradasDeCompra(tx: Tx) {
  return tx
    .select({
      productoId: inventoryMovements.productoId,
      fecha: inventoryMovements.fecha,
      costoUnitCentavos: inventoryMovements.costoUnitCentavos,
    })
    .from(inventoryMovements)
    .where(and(isNull(inventoryMovements.deletedAt), eq(inventoryMovements.tipo, 'entrada')));
}

/** Slice dates to days and gather the counts into the domain's row shape. */
function mapearInsightRows(
  hoy: IsoDate,
  ventas: Awaited<ReturnType<typeof ventasRecientes>>,
  egresos: Awaited<ReturnType<typeof gastosRecientes>>,
  entradas: Awaited<ReturnType<typeof entradasDeCompra>>,
  catalogo: Awaited<ReturnType<typeof inventarioYConteos>>,
  conteos: Awaited<ReturnType<typeof conteosAsesor>>,
) {
  return {
    hoy,
    ventas: ventas.map((v) => ({ ...v, fecha: v.fecha.slice(0, 10) as IsoDate })),
    egresos: egresos.map((e) => ({ ...e, fecha: e.fecha.slice(0, 10) as IsoDate })),
    entradas: entradas.map((e) => ({ ...e, fecha: e.fecha.slice(0, 10) as IsoDate })),
    productos: catalogo.productos,
    stock: catalogo.stock,
    ultimoMovimiento: catalogo.ultimo,
    cuenta: contarCapacidades(hoy, conteos),
  };
}

/** Products, their net stock and their last movement date. */
async function inventarioYConteos(tx: Tx) {
  const productos = await tx
    .select({ id: products.id, nombre: products.nombre })
    .from(products)
    .where(isNull(products.deletedAt));
  const stock = await tx.execute<{ producto_id: string; cantidad: number }>(sql`
    SELECT m.producto_id, coalesce(sum(case when m.tipo = 'entrada' then m.cantidad else -m.cantidad end), 0)::int AS cantidad
      FROM inventory_movements m
     WHERE m.deleted_at IS NULL
     GROUP BY m.producto_id`);
  const ultimo = await tx.execute<{ producto_id: string; fecha: string | null }>(sql`
    SELECT producto_id, max(left(fecha, 10)) AS fecha
      FROM inventory_movements
     WHERE deleted_at IS NULL
     GROUP BY producto_id`);
  return {
    productos,
    stock: stock.map((s) => ({ productoId: s.producto_id, cantidad: Number(s.cantidad) })),
    ultimo: ultimo.map((m) => ({
      productoId: m.producto_id,
      fecha: m.fecha === null ? null : (String(m.fecha).slice(0, 10) as IsoDate),
    })),
  };
}

/** Upsert one insight; `state` and `resolved_at` are never in the `set`. */
function upsertInsight(tx: Tx, businessId: string, i: Insight, now: string) {
  return tx
    .insert(notices)
    .values({
      id: `${businessId}:${i.clave}`,
      source: 'asesor',
      severity: i.severity,
      title: i.title,
      body: i.body,
      ctaLabel: i.ctaLabel,
      ctaHref: i.ctaHref,
      state: 'nuevo',
      data: { kind: i.kind, urgencia: i.urgencia },
      businessId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: notices.id,
      set: {
        severity: i.severity,
        title: i.title,
        body: i.body,
        ctaLabel: i.ctaLabel,
        ctaHref: i.ctaHref,
        updatedAt: now,
      },
    });
}

/**
 * Materialise-on-read (ADR-088): upsert the current insights into `notices`
 * with deterministic ids, then auto-close the ones that vanished. A member's
 * dismissal survives a recompute — `state` and `resolved_at` are never touched
 * by the upsert — and an insight that fixed itself closes as `listo`, which is
 * what «Anteriores» shows for dealt-with rows.
 */
export async function materializarInsights(
  tx: Tx,
  businessId: string,
  insights: readonly Insight[],
) {
  const now = new Date().toISOString();
  for (const i of insights) await upsertInsight(tx, businessId, i, now);
  const vivos = insights.map((i) => `${businessId}:${i.clave}`);
  const desaparecidos = await tx
    .update(notices)
    .set({ state: 'listo', resolvedAt: now, updatedAt: now })
    .where(
      and(
        eq(notices.source, 'asesor'),
        isNull(notices.resolvedAt),
        // Only rows this mechanism wrote: a manually created or fixture
        // asesor notice is not ours to close, even when no insight computes.
        sql`${notices.id} LIKE ${`${businessId}:%`}`,
        vivos.length > 0 ? notInArray(notices.id, vivos) : sql`true`,
      ),
    )
    .returning({ id: notices.id });
  return { materializados: insights.length, cerrados: desaparecidos.length };
}
