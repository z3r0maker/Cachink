/**
 * Fixture business for the mock: "Tacos La Esquina" with two Operators
 * (NIPs 1234 / 5678 — four digits, ADR-072), 20 products, 3 clients, 1 employee, 1 recurring
 * expense. Every row is parsed through the domain schema, so a fixture that
 * drifts from the entity shape fails at startup, not in a test.
 */

import { hashSync } from 'bcryptjs';
import {
  BusinessSchema,
  ClientSchema,
  EmployeeSchema,
  MensajeOperadorSchema,
  ProductSchema,
  RecurringExpenseSchema,
  UserSchema,
  type Business,
  type OpeningBalance,
  type OpeningBalanceClient,
  type ProductImage,
  type Client,
  type Employee,
  type MensajeOperador,
  type Product,
  type RecurringExpense,
  type User,
} from '@xangarro/domain';
import { ulidOf } from './ids.js';

export const FIXTURE_BUSINESS_ID = ulidOf('BZN', 1);
export const FIXTURE_DEVICE_ID_SEED = ulidOf('DEV', 1);
export const FIXTURE_EMAIL = 'dueno@tacoslaesquina.mx';
export const FIXTURE_BUSINESS_NOMBRE = 'Tacos La Esquina';
/** The owner's first name, as `/activate/preview` names it (N-25). */
export const FIXTURE_OWNER_NOMBRE = 'Lupita';
export const OPERATOR_PINS = { Toni: '1234', Ana: '5678' } as const;
const T0 = '2026-09-01T12:00:00.000Z';

function audit(seq: number, deviceId = FIXTURE_DEVICE_ID_SEED) {
  return {
    businessId: FIXTURE_BUSINESS_ID,
    deviceId,
    createdByUserId: null,
    createdAt: T0,
    updatedAt: T0,
    deletedAt: null,
    _seq: seq,
  };
}

export interface FixtureRows {
  readonly businesses: readonly Business[];
  readonly users: readonly User[];
  readonly products: readonly Product[];
  readonly clients: readonly Client[];
  readonly employees: readonly Employee[];
  readonly recurring_expenses: readonly RecurringExpense[];
  readonly mensajes_operador: readonly MensajeOperador[];
  /** Day-one facts (C-20); the demo business starts without them. */
  readonly opening_balances: readonly OpeningBalance[];
  readonly opening_balance_clients: readonly OpeningBalanceClient[];
  /** Product photos (ADR-134); the demo catalogue has none until a phone takes one. */
  readonly product_images: readonly ProductImage[];
}

const PRODUCT_NAMES = [
  'Taco al pastor',
  'Taco de bistec',
  'Taco de suadero',
  'Quesadilla',
  'Gringa',
  'Torta',
  'Agua de horchata',
  'Agua de jamaica',
  'Refresco 600ml',
  'Cerveza',
  'Orden de guacamole',
  'Frijoles charros',
  'Consomé',
  'Volcán',
  'Alambre',
  'Costra',
  'Café',
  'Flan',
  'Arroz con leche',
  'Bolsa de hielo',
] as const;
type ProductName = (typeof PRODUCT_NAMES)[number];

const pinHash = (pin: string): string => hashSync(pin, 4); // low cost: dev only

function business(): Business {
  return BusinessSchema.parse({
    id: FIXTURE_BUSINESS_ID,
    nombre: FIXTURE_BUSINESS_NOMBRE,
    regimenFiscal: 'RESICO',
    isrTasa: 100,
    logoUrl: null,
    tipoNegocio: 'producto-con-stock',
    ...audit(1),
  });
}

function operator(n: number, nombre: keyof typeof OPERATOR_PINS, avatarColor: string): User {
  return UserSchema.parse({
    id: ulidOf('PRS', n),
    nombre,
    pinHash: pinHash(OPERATOR_PINS[nombre]),
    avatarColor,
    // Ana may cancel sales, Toni may not — both permission paths are testable.
    permissions: { canCancelSales: nombre === 'Ana' },
    active: true,
    ...audit(1 + n),
  });
}

/**
 * Barcodes the escáner flows read (M-19, ADR-150), made up under the GS1
 * Mexico prefix. Refresco has its own; Cerveza and Agua de jamaica share one,
 * written as EAN-13 and as UPC-A, so a typed code finds both and the escáner
 * asks which one. Every other product keeps a plain code.
 */
export const MOCK_BARCODES = {
  'Refresco 600ml': '7509876500017',
  Cerveza: '0012345000065',
  'Agua de jamaica': '012345000065',
} as const satisfies Partial<Record<ProductName, string>>;

function product(nombre: ProductName, i: number): Product {
  const codigos: Partial<Record<ProductName, string>> = MOCK_BARCODES;
  return ProductSchema.parse({
    id: ulidOf('PRD', i + 1),
    nombre,
    sku: codigos[nombre] ?? `SKU-${String(i + 1).padStart(3, '0')}`,
    categoria: 'Producto Terminado',
    costoUnitCentavos: BigInt(1000 + i * 100),
    unidad: 'pza',
    tipo: 'producto',
    seguirStock: true,
    precioVentaCentavos: BigInt(2500 + i * 250),
    ...audit(10 + i),
  });
}

function client(nombre: string, i: number): Client {
  return ClientSchema.parse({
    id: ulidOf('CNT', i + 1),
    nombre,
    telefono: null,
    email: null,
    nota: null,
    ...audit(40 + i),
  });
}

function mensajes(): readonly MensajeOperador[] {
  return [
    // The aclaración Avisos answers in place, and a plain notice (ADR-075).
    MensajeOperadorSchema.parse({
      id: ulidOf('MSG', 1),
      operadorId: ulidOf('PRS', 1),
      cajaTurnoId: ulidOf('TRN', 1),
      severidad: 'aclaracion',
      cuerpo: 'Aclara el corte del 13 de mayo',
      ...audit(70),
    }),
    MensajeOperadorSchema.parse({
      id: ulidOf('MSG', 2),
      operadorId: ulidOf('PRS', 1),
      cajaTurnoId: null,
      severidad: 'info',
      cuerpo: 'La gringa sube a $65 desde mañana',
      ...audit(71),
    }),
  ];
}

export function buildFixtures(): FixtureRows {
  return {
    businesses: [business()],
    users: [operator(1, 'Toni', 'yellow'), operator(2, 'Ana', 'blue')],
    products: PRODUCT_NAMES.map(product),
    clients: ['Don Pedro', 'Oficina Contable Ruiz', 'María López'].map(client),
    employees: [
      EmployeeSchema.parse({
        id: ulidOf('EMP', 1),
        nombre: 'Ana',
        puesto: 'Cajera',
        salarioCentavos: 350_000n,
        periodo: 'quincenal',
        ...audit(50),
      }),
    ],
    recurring_expenses: [
      RecurringExpenseSchema.parse({
        id: ulidOf('REC', 1),
        concepto: 'Renta local',
        categoria: 'Renta',
        montoCentavos: 1_200_000n,
        proveedor: null,
        frecuencia: 'mensual',
        diaDelMes: 1,
        diaDeLaSemana: null,
        // Due on this month's 1st (local, as the phone's hoyLocal): exactly one payment due.
        proximoDisparo: `${new Date().toLocaleDateString('en-CA').slice(0, 7)}-01`,
        activo: true,
        ...audit(60),
      }),
    ],
    mensajes_operador: mensajes(),
    opening_balances: [],
    opening_balance_clients: [],
    product_images: [],
  };
}
