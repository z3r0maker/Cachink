/**
 * PowerSync client-side schema (ADR-035).
 *
 * Mirrors the 10 synced Drizzle tables in `@cachink/data/schema`. PowerSync
 * uses its own schema DSL at runtime — we declare it here in a
 * data-oriented shape so the same definition compiles whether the app
 * picks up `@powersync/react-native` (mobile) or `@powersync/web`
 * (desktop). The actual `AppSchema` / `Schema` object is built from this
 * data by `../client/*` factories.
 *
 * Keep the entries ordered to match the Drizzle schema — drift between
 * the two is the kind of bug that surfaces only at sync time.
 */

export const SYNCED_TABLES = [
  'businesses',
  'sales',
  'expenses',
  'products',
  'inventory_movements',
  'employees',
  'clients',
  'client_payments',
  'day_closes',
  'recurring_expenses',
] as const;

export type SyncedTable = (typeof SYNCED_TABLES)[number];

/** Column metadata used by the PowerSync factory to build the Table object. */
export interface ColumnSpec {
  readonly name: string;
  readonly type: 'text' | 'integer' | 'real' | 'numeric';
  readonly notNull?: boolean;
}

export interface TableSpec {
  readonly name: SyncedTable;
  readonly columns: readonly ColumnSpec[];
  readonly indexes?: readonly { readonly name: string; readonly columns: readonly string[] }[];
}

const AUDIT_COLS: readonly ColumnSpec[] = [
  { name: 'business_id', type: 'text', notNull: true },
  { name: 'device_id', type: 'text', notNull: true },
  { name: 'created_at', type: 'text', notNull: true },
  { name: 'updated_at', type: 'text', notNull: true },
  { name: 'deleted_at', type: 'text' },
];

export const TABLES: readonly TableSpec[] = [
  {
    name: 'businesses',
    columns: [
      { name: 'nombre', type: 'text', notNull: true },
      { name: 'regimen_fiscal', type: 'text', notNull: true },
      { name: 'isr_tasa', type: 'real', notNull: true },
      { name: 'logo_url', type: 'text' },
      ...AUDIT_COLS,
    ],
    indexes: [{ name: 'idx_businesses_biz', columns: ['business_id'] }],
  },
  {
    name: 'sales',
    columns: [
      { name: 'fecha', type: 'text', notNull: true },
      { name: 'concepto', type: 'text', notNull: true },
      { name: 'categoria', type: 'text', notNull: true },
      { name: 'monto_centavos', type: 'numeric', notNull: true },
      { name: 'metodo', type: 'text', notNull: true },
      { name: 'cliente_id', type: 'text' },
      { name: 'estado_pago', type: 'text', notNull: true },
      ...AUDIT_COLS,
    ],
    indexes: [
      { name: 'idx_sales_biz_fecha', columns: ['business_id', 'fecha'] },
      { name: 'idx_sales_cliente', columns: ['cliente_id'] },
    ],
  },
  {
    name: 'expenses',
    columns: [
      { name: 'fecha', type: 'text', notNull: true },
      { name: 'concepto', type: 'text', notNull: true },
      { name: 'categoria', type: 'text', notNull: true },
      { name: 'monto_centavos', type: 'numeric', notNull: true },
      { name: 'proveedor', type: 'text' },
      { name: 'gasto_recurrente_id', type: 'text' },
      ...AUDIT_COLS,
    ],
    indexes: [{ name: 'idx_expenses_biz_fecha', columns: ['business_id', 'fecha'] }],
  },
  {
    name: 'products',
    columns: [
      { name: 'nombre', type: 'text', notNull: true },
      { name: 'sku', type: 'text' },
      { name: 'categoria', type: 'text', notNull: true },
      { name: 'costo_unit_centavos', type: 'numeric', notNull: true },
      { name: 'unidad', type: 'text', notNull: true },
      { name: 'umbral_stock_bajo', type: 'integer', notNull: true },
      ...AUDIT_COLS,
    ],
  },
  {
    name: 'inventory_movements',
    columns: [
      { name: 'producto_id', type: 'text', notNull: true },
      { name: 'fecha', type: 'text', notNull: true },
      { name: 'tipo', type: 'text', notNull: true },
      { name: 'cantidad', type: 'integer', notNull: true },
      { name: 'costo_unit_centavos', type: 'numeric', notNull: true },
      { name: 'motivo', type: 'text', notNull: true },
      { name: 'nota', type: 'text' },
      ...AUDIT_COLS,
    ],
  },
  {
    name: 'employees',
    columns: [
      { name: 'nombre', type: 'text', notNull: true },
      { name: 'puesto', type: 'text', notNull: true },
      { name: 'salario_centavos', type: 'numeric', notNull: true },
      { name: 'periodo', type: 'text', notNull: true },
      ...AUDIT_COLS,
    ],
  },
  {
    name: 'clients',
    columns: [
      { name: 'nombre', type: 'text', notNull: true },
      { name: 'telefono', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'nota', type: 'text' },
      ...AUDIT_COLS,
    ],
  },
  {
    name: 'client_payments',
    columns: [
      { name: 'venta_id', type: 'text', notNull: true },
      { name: 'fecha', type: 'text', notNull: true },
      { name: 'monto_centavos', type: 'numeric', notNull: true },
      { name: 'metodo', type: 'text', notNull: true },
      { name: 'nota', type: 'text' },
      ...AUDIT_COLS,
    ],
  },
  {
    name: 'day_closes',
    columns: [
      { name: 'fecha', type: 'text', notNull: true },
      { name: 'efectivo_esperado_centavos', type: 'numeric', notNull: true },
      { name: 'efectivo_contado_centavos', type: 'numeric', notNull: true },
      { name: 'diferencia_centavos', type: 'numeric', notNull: true },
      { name: 'explicacion', type: 'text' },
      { name: 'cerrado_por', type: 'text', notNull: true },
      ...AUDIT_COLS,
    ],
  },
  {
    name: 'recurring_expenses',
    columns: [
      { name: 'concepto', type: 'text', notNull: true },
      { name: 'categoria', type: 'text', notNull: true },
      { name: 'monto_centavos', type: 'numeric', notNull: true },
      { name: 'proveedor', type: 'text' },
      { name: 'frecuencia', type: 'text', notNull: true },
      { name: 'dia_del_mes', type: 'integer' },
      { name: 'dia_de_la_semana', type: 'integer' },
      { name: 'proximo_disparo', type: 'text', notNull: true },
      { name: 'activo', type: 'integer', notNull: true },
      ...AUDIT_COLS,
    ],
  },
];
