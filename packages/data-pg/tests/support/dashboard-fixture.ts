import { sql } from 'drizzle-orm';

import { withBusiness, type Db } from '../../src/client.js';
import { testId } from './test-ids';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The dashboard suite's own tenant, and the rows it reads back.
 *
 * The seeded Taquería is a moving target: `seed-finanzas` anchors two months
 * of ventas, egresos and cortes to the day the seed runs, and `seed-extra` /
 * `seed-revision` add more May rows on top of the frozen `seed-data` fixtures.
 * Any assertion transcribed from those fixtures is true only until the next
 * seed lands. So the dashboard reads get a tenant no seed writes to, and the
 * expectations below are **derived from these rows**, never typed out beside
 * them — a row added here moves its own total.
 */
export const DASH_BIZ = testId('W');

/** The window the totals are asked for, and the one day inside it. */
export const RANGO = { from: '2026-05-01', to: '2026-05-31', dia: '2026-05-12' } as const;

/** The concepto every soft-deleted fixture row carries, so a leak is visible. */
export const BORRADO = 'Registro borrado';

/** `estado` marks the rows a read must skip; the rest are live and countable. */
type Estado = 'borrada' | 'cancelada';
type Fila = readonly [fecha: string, centavos: number, hora: string, estado?: Estado];

const VENTAS: readonly Fila[] = [
  ['2026-05-12', 75_00, '14:00'],
  ['2026-05-12', 60_00, '15:00'],
  ['2026-05-12', 60_00, '16:00'],
  ['2026-05-14', 80_00, '13:00'],
  ['2026-05-20', 250_00, '13:00'],
  ['2026-05-28', 120_00, '13:00'],
  ['2026-06-02', 999_00, '13:00'], // outside the range
  ['2026-05-13', 500_00, '13:00', 'borrada'],
  ['2026-05-13', 500_00, '14:00', 'cancelada'],
];

const GASTOS: readonly Fila[] = [
  ['2026-05-02', 420_00, '09:00'],
  ['2026-05-05', 340_00, '09:00'],
  ['2026-05-15', 8150_00, '09:00'],
  ['2026-05-30', 6000_00, '09:00'],
  ['2026-05-31', 1800_00, '09:00'],
  ['2026-06-03', 700_00, '09:00'], // outside the range
  ['2026-05-13', 900_00, '10:00', 'borrada'],
];

/** [nombre, umbral, entradas, salidas] — stock is derived from the movements. */
const PRODUCTOS = [
  ['Refresco', 24, 12, 0],
  ['Tortilla (kg)', 10, 3, 0],
  ['Taco al pastor', 40, 120, 13],
] as const;

/** The newest corte is inserted in the middle, so fecha order is the only order. */
const CORTE_NUEVO = ['2026-05-11', -600] as const;
const CORTES = [['2026-05-09', 0], CORTE_NUEVO, ['2026-05-10', 250_00]] as const;

const vivasEnRango = (filas: readonly Fila[]): readonly Fila[] =>
  filas.filter(
    ([fecha, , , estado]) => estado === undefined && fecha >= RANGO.from && fecha <= RANGO.to,
  );

const total = (filas: readonly Fila[]): bigint =>
  filas.reduce((acc, [, centavos]) => acc + BigInt(centavos), 0n);

const ventasEnRango = vivasEnRango(VENTAS);
const delDia = ventasEnRango.filter(([fecha]) => fecha === RANGO.dia);
const gastosEnRango = vivasEnRango(GASTOS);

export const ESPERADO = {
  ventas: total(ventasEnRango),
  ventasCount: ventasEnRango.length,
  ventasDelDia: total(delDia),
  ventasDelDiaCount: delDia.length,
  gastos: total(gastosEnRango),
  gastosCount: gastosEnRango.length,
} as const;

/** What `lowStock` must derive: entradas signed positive, salidas negative. */
export const STOCK = PRODUCTOS.map(([nombre, umbral, entradas, salidas]) => ({
  nombre,
  umbral,
  stock: entradas - salidas,
}));

export const ULTIMO_CORTE = { fecha: CORTE_NUEVO[0], diferencia: BigInt(CORTE_NUEVO[1]) } as const;

/** Any product id: `sales.producto_id` is not a foreign key and no read joins it. */
const PRODUCTO_VENDIDO = testId('W');

const movimiento = (tx: Tx, productoId: string, tipo: 'entrada' | 'salida', cantidad: number) =>
  tx.execute(sql`
    INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos,
                                     motivo, business_id, device_id, created_at, updated_at)
    VALUES (${testId('W')}, ${productoId}, ${RANGO.dia}, ${tipo}, ${cantidad}, 1000,
            ${tipo === 'entrada' ? 'Compra a proveedor' : 'Venta'},
            ${DASH_BIZ}, ${DASH_BIZ}, now(), now())`);

async function insertProductos(tx: Tx): Promise<void> {
  for (const [nombre, umbral, entradas, salidas] of PRODUCTOS) {
    const productoId = testId('W');
    await tx.execute(sql`
      INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                            tipo, seguir_stock, precio_venta_centavos, business_id, device_id,
                            created_at, updated_at)
      VALUES (${productoId}, ${nombre}, 'Producto Terminado', 1000, 'pza', ${umbral}, 'producto',
              true, 2000, ${DASH_BIZ}, ${DASH_BIZ}, now(), now())`);
    await movimiento(tx, productoId, 'entrada', entradas);
    if (salidas > 0) await movimiento(tx, productoId, 'salida', salidas);
  }
}

async function insertVentas(tx: Tx): Promise<void> {
  let folio = 0;
  for (const [fecha, centavos, hora, estado] of VENTAS) {
    folio += 1;
    const id = testId('W');
    const at = `${fecha}T${hora}:00+00`;
    const concepto = estado === 'borrada' ? BORRADO : 'Orden de tacos';
    await tx.execute(sql`
      INSERT INTO tickets (id, folio, fecha, hora, concepto, metodo, estado_pago, cancelled_at,
                           business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${folio}, ${fecha}, ${hora}, ${concepto}, 'Efectivo', 'pagado',
              ${estado === 'cancelada' ? at : null}, ${DASH_BIZ}, ${DASH_BIZ}, ${at}, ${at})`);
    await tx.execute(sql`
      INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos, producto_id,
                         cantidad, business_id, device_id, created_at, updated_at, deleted_at)
      VALUES (${id}, ${id}, ${fecha}, ${concepto}, 'Producto', ${centavos}, ${PRODUCTO_VENDIDO}, 1,
              ${DASH_BIZ}, ${DASH_BIZ}, ${at}, ${at}, ${estado === 'borrada' ? at : null})`);
  }
}

async function insertGastos(tx: Tx): Promise<void> {
  for (const [fecha, centavos, hora, estado] of GASTOS) {
    const at = `${fecha}T${hora}:00+00`;
    await tx.execute(sql`
      INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id,
                            created_at, updated_at, deleted_at)
      VALUES (${testId('W')}, ${fecha}, ${estado === 'borrada' ? BORRADO : 'Insumos'},
              'Materia Prima', ${centavos}, ${DASH_BIZ}, ${DASH_BIZ}, ${at}, ${at},
              ${estado === 'borrada' ? at : null})`);
  }
}

async function insertCortes(tx: Tx): Promise<void> {
  for (const [fecha, diferencia] of CORTES) {
    await tx.execute(sql`
      INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos,
                              diferencia_centavos, cerrado_por, business_id, device_id,
                              created_at, updated_at)
      VALUES (${testId('W')}, ${fecha}, 100000, ${100000 + diferencia}, ${diferencia}, 'Director',
              ${DASH_BIZ}, ${DASH_BIZ}, now(), now())`);
  }
}

/** Writes the fixture through the app role, so RLS admits it like a request. */
export async function seedDashboardFixture(db: Db): Promise<void> {
  await withBusiness(db, DASH_BIZ, async (tx) => {
    await insertProductos(tx);
    await insertVentas(tx);
    await insertGastos(tx);
    await insertCortes(tx);
  });
}
