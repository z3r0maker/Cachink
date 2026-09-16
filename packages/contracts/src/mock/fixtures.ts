/**
 * Fixture business for the mock: "Tacos La Esquina" with two Operators
 * (PINs 123456 / 567890), 20 products, 3 clients, 1 employee, 1 recurring
 * expense. Every row is parsed through the domain schema, so a fixture that
 * drifts from the entity shape fails at startup, not in a test.
 */

import { hashSync } from 'bcryptjs';
import {
  BusinessSchema,
  ClientSchema,
  EmployeeSchema,
  ProductSchema,
  RecurringExpenseSchema,
  UserSchema,
  type Business,
  type Client,
  type Employee,
  type Product,
  type RecurringExpense,
  type User,
} from '@xangarro/domain';
import { ulidOf } from './ids.js';

export const FIXTURE_BUSINESS_ID = ulidOf('BZN', 1);
export const FIXTURE_DEVICE_ID_SEED = ulidOf('DEV', 1);
export const FIXTURE_EMAIL = 'dueno@tacoslaesquina.mx';
export const OPERATOR_PINS = { Toni: '123456', Ana: '567890' } as const;
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
];

const pinHash = (pin: string): string => hashSync(pin, 4); // low cost: dev only

function business(): Business {
  return BusinessSchema.parse({
    id: FIXTURE_BUSINESS_ID,
    nombre: 'Tacos La Esquina',
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

function product(nombre: string, i: number): Product {
  return ProductSchema.parse({
    id: ulidOf('PRD', i + 1),
    nombre,
    sku: `SKU-${String(i + 1).padStart(3, '0')}`,
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
        proximoDisparo: '2026-10-01',
        activo: true,
        ...audit(60),
      }),
    ],
  };
}
