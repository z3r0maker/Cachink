/**
 * Transaction seeders — sales, expenses, and recurring expenses.
 *
 * Extracted from seed-demo-data.ts so each file stays under the
 * 200-line budget (CLAUDE.md §2.6).
 */

import type { BusinessId, ClientId, IsoDate, Product } from '@cachink/domain';
import type { Repositories } from '../app/repository-provider';
import { DEMO_EXPENSE_TEMPLATES, DEMO_SALE_TEMPLATES } from './demo-data-catalog';
import { toIsoDate, toHora, daysAgo } from './seed-helpers';

/** Pick a pseudo-random payment method (weighted towards Efectivo). */
function pickMetodo(i: number): 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'QR/CoDi' {
  const r = i % 20;
  if (r < 14) return 'Efectivo';
  if (r < 17) return 'Transferencia';
  if (r < 19) return 'Tarjeta';
  return 'QR/CoDi';
}

export async function seedSales(
  r: Repositories,
  biz: BusinessId,
  products: Product[],
  clients: { id: string }[],
): Promise<number> {
  let count = 0;
  const templates = DEMO_SALE_TEMPLATES;

  for (let day = 29; day >= 0; day--) {
    // Bad week: days 7-13 ago have reduced sales (simulates a slow week)
    const isBadWeek = day >= 7 && day <= 13;
    const salesPerDay = isBadWeek ? 3 + (day % 3) : 10 + (day % 5);

    for (let s = 0; s < salesPerDay; s++) {
      const tpl = templates[count % templates.length]!;
      const product = products[tpl.productIndex]!;
      const saleDate = daysAgo(day);

      // Sprinkle Crédito sales for cuentas por cobrar testing
      const isCredito = count === 8 || count === 25 || count === 60;
      const client = clients[count % clients.length]!;

      await r.sales.create({
        fecha: toIsoDate(saleDate),
        hora: toHora(saleDate),
        concepto: tpl.concepto,
        categoria: 'Producto',
        monto: tpl.montoCentavos,
        metodo: isCredito ? 'Crédito' : pickMetodo(count),
        clienteId: isCredito ? (client.id as ClientId) : undefined,
        productoId: product.id,
        cantidad: tpl.cantidad,
        businessId: biz,
      });
      count += 1;
    }
  }
  return count;
}

export async function seedExpenses(
  r: Repositories,
  biz: BusinessId,
): Promise<number> {
  let count = 0;
  for (let i = 0; i < DEMO_EXPENSE_TEMPLATES.length; i++) {
    const tpl = DEMO_EXPENSE_TEMPLATES[i]!;
    const dayOffset = (i * 2) % 30;
    await r.expenses.create({
      fecha: toIsoDate(daysAgo(dayOffset)),
      concepto: tpl.concepto,
      categoria: tpl.categoria,
      monto: tpl.montoCentavos,
      proveedor: tpl.proveedor,
      businessId: biz,
    });
    count += 1;
  }
  return count;
}

export async function seedRecurringExpenses(
  r: Repositories,
  biz: BusinessId,
): Promise<number> {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  const next = toIsoDate(nextMonth);

  const entries: Array<{
    concepto: string;
    cat: 'Renta' | 'Servicios';
    monto: bigint;
    dia: number;
  }> = [
    { concepto: 'Renta del local', cat: 'Renta', monto: 550_000n, dia: 1 },
    { concepto: 'Luz CFE', cat: 'Servicios', monto: 130_000n, dia: 15 },
    { concepto: 'Internet Telmex', cat: 'Servicios', monto: 49_900n, dia: 20 },
  ];

  for (const e of entries) {
    await r.recurringExpenses.create({
      concepto: e.concepto,
      categoria: e.cat,
      montoCentavos: e.monto,
      frecuencia: 'mensual',
      diaDelMes: e.dia,
      proximoDisparo: next as IsoDate,
      activo: true,
      businessId: biz,
    });
  }

  return entries.length;
}
