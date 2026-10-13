/**
 * MEXIA's management chart of accounts (E-02, ADR-124 §4). Small on purpose:
 * the contador keeps the legal books; this chart only has to produce the P&L
 * cascade, the balance sheet, the partner accounts and the IVA position.
 *
 * `sat` is the código agrupador (Anexo 24 RMF) the contador validates once
 * (E-02's acceptance) and E-43 exports by. Null until validated: an unverified
 * code is worse than none.
 */
export type AccountGroup = 'activo' | 'pasivo' | 'capital' | 'ingreso' | 'costo' | 'gasto' | 'otro';

/** Which side increases the account. */
export type Naturaleza = 'deudora' | 'acreedora';

export interface Account {
  readonly nombre: string;
  readonly grupo: AccountGroup;
  readonly naturaleza: Naturaleza;
  readonly sat: string | null;
}

const a = (nombre: string, grupo: AccountGroup, naturaleza: Naturaleza): Account => ({
  nombre,
  grupo,
  naturaleza,
  sat: null,
});

export const ACCOUNTS = {
  bancos: a('Bancos', 'activo', 'deudora'),
  stripe_por_depositar: a('Stripe por depositar', 'activo', 'deudora'),
  iva_acreditable: a('IVA acreditable', 'activo', 'deudora'),
  proveedores: a('Proveedores', 'pasivo', 'acreedora'),
  iva_trasladado: a('IVA trasladado', 'pasivo', 'acreedora'),
  isr_por_pagar: a('ISR por pagar', 'pasivo', 'acreedora'),
  iva_por_pagar: a('IVA por pagar', 'pasivo', 'acreedora'),
  retenciones_por_pagar: a('Retenciones por pagar', 'pasivo', 'acreedora'),
  prestamos_socios: a('Préstamos de socios', 'pasivo', 'acreedora'),
  capital_social: a('Capital social', 'capital', 'acreedora'),
  afac: a('Aportaciones para futuros aumentos de capital', 'capital', 'acreedora'),
  resultados_acumulados: a('Resultados acumulados', 'capital', 'acreedora'),
  ingresos: a('Ingresos', 'ingreso', 'acreedora'),
  costo_servicio: a('Costo del servicio', 'costo', 'deudora'),
  ventas_marketing: a('Ventas y marketing', 'gasto', 'deudora'),
  desarrollo: a('Desarrollo', 'gasto', 'deudora'),
  administracion: a('Administración', 'gasto', 'deudora'),
  depreciacion: a('Depreciación y amortización', 'gasto', 'deudora'),
  financiero: a('Resultado financiero', 'otro', 'deudora'),
  isr_resultado: a('ISR del ejercicio', 'otro', 'deudora'),
} as const satisfies Record<string, Account>;

export type AccountKey = keyof typeof ACCOUNTS;

/** The four expense categories a founder picks from, in the approved palette's fixed order. */
export const CATEGORIAS_GASTO = [
  'costo_servicio',
  'ventas_marketing',
  'desarrollo',
  'administracion',
] as const satisfies readonly AccountKey[];

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export function isAccountKey(value: string): value is AccountKey {
  return Object.prototype.hasOwnProperty.call(ACCOUNTS, value);
}
