import { sql } from 'drizzle-orm';
import { bigint, check, date, integer, smallint, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';
import { recurringTemplates } from './ledger.js';

/**
 * MEXIA's third-party services (E-24, boards CD-18 to CD-18d). One row per
 * service; the columns a way of charging does not use stay null. A service
 * that charges on a day owns its recurring template, which suggests the
 * charge in Movimientos; what those charges posted is the service's cost.
 * Never deleted: a dropped service is `estado = 'baja'` and keeps its history.
 * `paga_con` names a card by its last four digits only.
 */
export const services = corp.table(
  'services',
  {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    para: text('para'),
    /** A `CategoriaGasto` of `@xangarro/domain/corp`. */
    categoria: text('categoria').notNull(),
    cobro: text('cobro', { enum: ['fijo', 'uso', 'comision', 'gratis', 'anual'] }).notNull(),
    estado: text('estado', { enum: ['activo', 'por_contratar', 'baja'] }).notNull(),
    moneda: text('moneda', { enum: ['MXN', 'USD'] })
      .notNull()
      .default('MXN'),
    /** `moneda` centavos: each month's charge (`fijo`) or the year's (`anual`). */
    monto: bigint('monto', { mode: 'bigint' }),
    diaCargo: smallint('dia_cargo'),
    renueva: date('renueva', { mode: 'string' }),
    tarifa: text('tarifa'),
    /** MXN centavos. */
    aviso: bigint('aviso', { mode: 'bigint' }),
    limite: integer('limite'),
    usoPlan: integer('uso_plan'),
    unidad: text('unidad'),
    /** MXN centavos, as of `gasto_al`. */
    gastoMes: bigint('gasto_mes', { mode: 'bigint' }),
    gastoAl: date('gasto_al', { mode: 'string' }),
    pagaCon: text('paga_con'),
    plantillaId: text('plantilla_id')
      .references(() => recurringTemplates.id)
      .unique(),
    updatedBy: text('updated_by').notNull(),
    updatedAt: at('updated_at').notNull(),
  },
  (t) => [
    check(
      'services_categoria_check',
      sql`${t.categoria} IN ('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion')`,
    ),
    check(
      'services_montos_check',
      sql`(${t.monto} IS NULL OR ${t.monto} > 0) AND (${t.aviso} IS NULL OR ${t.aviso} > 0)
          AND (${t.gastoMes} IS NULL OR ${t.gastoMes} >= 0)`,
    ),
    check(
      'services_cobro_check',
      sql`${t.cobro} IN ('fijo', 'uso', 'comision', 'gratis', 'anual')`,
    ),
    check('services_estado_check', sql`${t.estado} IN ('activo', 'por_contratar', 'baja')`),
    check('services_dia_check', sql`${t.diaCargo} IS NULL OR ${t.diaCargo} BETWEEN 1 AND 31`),
    check(
      'services_plan_check',
      sql`(${t.limite} IS NULL OR ${t.limite} > 0) AND (${t.usoPlan} IS NULL OR ${t.usoPlan} >= 0)`,
    ),
  ],
);
