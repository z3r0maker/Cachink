/**
 * Cloud schema — catalog tables.
 *
 * Bootstrapped from the device's SQLite schema so that **column names are
 * identical on both sides by construction**, then maintained by hand.
 * `tests/drift.test.ts` is what keeps them that way: the sync wire format
 * addresses columns by name, so a silent rename would corrupt rows rather than
 * fail loudly.
 *
 * Types differ where Postgres has better ones — `timestamptz` for the audit
 * stamps, `bigint` for centavos — but never the names.
 */

import { sql } from 'drizzle-orm';
import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { auditColumns, centavos } from './_columns';

export const auditoriasInventario = pgTable('auditorias_inventario', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  estado: text('estado', { enum: ['borrador', 'finalizada'] }).notNull(),
  lineas: text('lineas').notNull(),
  totalDiscrepancias: integer('total_discrepancias').notNull().default(0),
  totalProductos: integer('total_productos').notNull(),
  productosContados: integer('productos_contados').notNull().default(0),
  ...auditColumns,
});

export const conversionRecetas = pgTable('conversion_recetas', {
  id: text('id').primaryKey(),
  materiaPrimaId: text('materia_prima_id').notNull(),
  productoResultanteId: text('producto_resultante_id').notNull(),
  cantidadOrigen: integer('cantidad_origen').notNull(),
  cantidadResultante: integer('cantidad_resultante').notNull(),
  ...auditColumns,
});

export const conversions = pgTable('conversions', {
  id: text('id').primaryKey(),
  recetaId: text('receta_id').notNull(),
  materiaPrimaId: text('materia_prima_id').notNull(),
  productoResultanteId: text('producto_resultante_id').notNull(),
  cantidadOrigenUsada: integer('cantidad_origen_usada').notNull(),
  cantidadResultanteCreada: integer('cantidad_resultante_creada').notNull(),
  movimientoSalidaId: text('movimiento_salida_id').notNull(),
  movimientoEntradaId: text('movimiento_entrada_id').notNull(),
  ...auditColumns,
});

export const inventoryMovements = pgTable('inventory_movements', {
  id: text('id').primaryKey(),
  productoId: text('producto_id').notNull(),
  fecha: text('fecha').notNull(),
  tipo: text('tipo', { enum: ['entrada', 'salida'] }).notNull(),
  cantidad: integer('cantidad').notNull(),
  costoUnitCentavos: centavos('costo_unit_centavos').notNull(),
  motivo: text('motivo').notNull(),
  nota: text('nota'),
  ...auditColumns,
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  sku: text('sku'),
  categoria: text('categoria', {
    enum: ['Materia Prima', 'Producto Terminado', 'Empaque', 'Herramienta', 'Insumo', 'Otro'],
  }).notNull(),
  costoUnitCentavos: centavos('costo_unit_centavos').notNull(),
  unidad: text('unidad', {
    enum: ['pza', 'kg', 'lt', 'm', 'caja', 'bolsa', 'rollo', 'par', 'otro'],
  }).notNull(),
  umbralStockBajo: integer('umbral_stock_bajo').notNull().default(3),
  tipo: text('tipo', { enum: ['producto', 'servicio'] })
    .notNull()
    .default('producto'),
  seguirStock: boolean('seguir_stock').notNull().default(true),
  precioVentaCentavos: centavos('precio_venta_centavos')
    .notNull()
    .default(sql`0`),
  atributos: text('atributos').notNull().default('{}'),
  colorFondo: text('color_fondo', {
    enum: ['white', 'yellow', 'green', 'blue', 'pink', 'purple', 'peach', 'gray'],
  })
    .notNull()
    .default('white'),
  usoProducto: text('uso_producto', { enum: ['venta', 'materia-prima', 'ambos'] })
    .notNull()
    .default('venta'),
  icono: text('icono'),
  estadoRevision: text('estado_revision', {
    enum: ['pendiente', 'aprobado', 'fusionado', 'rechazado'],
  })
    .notNull()
    .default('aprobado'),
  fusionadoConId: text('fusionado_con_id'),
  ...auditColumns,
});
