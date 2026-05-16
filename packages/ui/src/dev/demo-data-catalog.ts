/**
 * Demo data catalog — pure arrays of realistic Mexican small-business data.
 *
 * Used by `seedDemoData` to populate the app for manual testing of reports,
 * corte de caja, cambio de turno, and all financial modules. All amounts
 * are integer centavos (CLAUDE.md §2.8).
 *
 * Scenario: "Tortillería La Esperanza" — a taquería/tortillería in
 * Guadalajara, running for ~1 month.
 */

import type { BusinessId, NewClient, NewEmployee, NewProduct } from '@cachink/domain';

// ---------------------------------------------------------------------------
// Products — mix of venta + materia-prima
// ---------------------------------------------------------------------------

export function demoProducts(biz: BusinessId): NewProduct[] {
  return [
    p(biz, 'Taco al Pastor', 'TAC-001', 2_500n, 1_200n, 'pza', 'venta', 5),
    p(biz, 'Taco de Bistec', 'TAC-002', 2_800n, 1_400n, 'pza', 'venta', 5),
    p(biz, 'Agua de Horchata 1L', 'AGU-001', 3_500n, 1_500n, 'lt', 'venta', 3),
    p(biz, 'Torta de Milanesa', 'TOR-001', 6_500n, 3_000n, 'pza', 'venta', 3),
    p(biz, 'Quesadilla', 'QUE-001', 2_000n, 1_000n, 'pza', 'venta', 5),
    p(biz, 'Refresco lata', 'REF-001', 2_500n, 1_200n, 'pza', 'venta', 5),
    mp(biz, 'Harina 25kg', 'HAR-001', 45_000n, 'kg', 3),
    mp(biz, 'Aceite 20L', 'ACE-001', 38_000n, 'lt', 3),
    mp(biz, 'Servilletas paq. 500', 'SER-001', 8_500n, 'pza', 5),
    mp(biz, 'Salsa verde 5L', 'SAL-001', 12_000n, 'lt', 3),
    mp(biz, 'Tortilla maíz kg', 'TORM-001', 2_200n, 'kg', 5),
    mp(biz, 'Carne pastor kg', 'CAR-001', 18_000n, 'kg', 3),
  ];
}

function p(
  businessId: BusinessId,
  nombre: string,
  sku: string,
  precioVentaCentavos: bigint,
  costoUnitCentavos: bigint,
  unidad: NewProduct['unidad'],
  usoProducto: NewProduct['usoProducto'],
  umbralStockBajo: number,
): NewProduct {
  return {
    nombre,
    sku,
    categoria: 'Producto Terminado',
    costoUnitCentavos,
    unidad,
    umbralStockBajo,
    tipo: 'producto',
    seguirStock: true,
    precioVentaCentavos,
    atributos: {},
    colorFondo: 'white',
    usoProducto,
    businessId,
  };
}

function mp(
  businessId: BusinessId,
  nombre: string,
  sku: string,
  costoUnitCentavos: bigint,
  unidad: NewProduct['unidad'],
  umbralStockBajo: number,
): NewProduct {
  return {
    nombre,
    sku,
    categoria: 'Materia Prima',
    costoUnitCentavos,
    unidad,
    umbralStockBajo,
    tipo: 'producto',
    seguirStock: true,
    precioVentaCentavos: 0n,
    atributos: {},
    colorFondo: 'white',
    usoProducto: 'materia-prima',
    businessId,
  };
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export function demoClients(biz: BusinessId): NewClient[] {
  return [
    { nombre: 'Laura Hernández', telefono: '3312345678', businessId: biz },
    { nombre: 'Roberto Sánchez', telefono: '3398765432', businessId: biz },
    { nombre: 'María del Carmen Ríos', businessId: biz },
    { nombre: 'Taller Mecánico El Güero', telefono: '3356781234', businessId: biz },
  ];
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export function demoEmployees(biz: BusinessId): NewEmployee[] {
  return [
    { nombre: 'María Pérez', puesto: 'Cajera', salarioCentavos: 3_500_000n, periodo: 'quincenal', businessId: biz },
    { nombre: 'Carlos Ramírez', puesto: 'Cocinero', salarioCentavos: 4_000_000n, periodo: 'quincenal', businessId: biz },
    { nombre: 'José López', puesto: 'Repartidor', salarioCentavos: 3_000_000n, periodo: 'semanal', businessId: biz },
  ];
}

// ---------------------------------------------------------------------------
// Expense templates — concepto + categoría + monto range
// ---------------------------------------------------------------------------

export interface DemoExpenseTemplate {
  readonly concepto: string;
  readonly categoria: 'Materia Prima' | 'Inventario' | 'Nómina' | 'Renta' | 'Servicios' | 'Otro';
  readonly montoCentavos: bigint;
  readonly proveedor?: string;
}

export const DEMO_EXPENSE_TEMPLATES: readonly DemoExpenseTemplate[] = [
  { concepto: 'Renta del local', categoria: 'Renta', montoCentavos: 1_200_000n },
  { concepto: 'Nómina — María Pérez', categoria: 'Nómina', montoCentavos: 3_500_000n },
  { concepto: 'Nómina — Carlos Ramírez', categoria: 'Nómina', montoCentavos: 4_000_000n },
  { concepto: 'Nómina — José López', categoria: 'Nómina', montoCentavos: 3_000_000n },
  { concepto: 'Luz CFE', categoria: 'Servicios', montoCentavos: 280_000n },
  { concepto: 'Gas LP tanque', categoria: 'Servicios', montoCentavos: 150_000n },
  { concepto: 'Compra carne — Carnicería Don Pedro', categoria: 'Materia Prima', montoCentavos: 800_000n, proveedor: 'Carnicería Don Pedro' },
  { concepto: 'Compra tortillas — Molino San Juan', categoria: 'Materia Prima', montoCentavos: 350_000n, proveedor: 'Molino San Juan' },
  { concepto: 'Verdura y salsa — Central de Abasto', categoria: 'Materia Prima', montoCentavos: 250_000n, proveedor: 'Central de Abasto' },
  { concepto: 'Internet Telmex', categoria: 'Servicios', montoCentavos: 59_900n },
  { concepto: 'Productos de limpieza', categoria: 'Otro', montoCentavos: 45_000n },
  { concepto: 'Aceite y desechables', categoria: 'Materia Prima', montoCentavos: 200_000n, proveedor: 'Sam\'s Club' },
  { concepto: 'Refrescos — Coca-Cola', categoria: 'Inventario', montoCentavos: 320_000n, proveedor: 'Distribuidora Coca-Cola' },
  { concepto: 'Mantenimiento plancha', categoria: 'Otro', montoCentavos: 85_000n },
  { concepto: 'Servilletas y bolsas', categoria: 'Otro', montoCentavos: 35_000n },
] as const;

// ---------------------------------------------------------------------------
// Sale templates — concepto picks from products
// ---------------------------------------------------------------------------

export interface DemoSaleTemplate {
  readonly concepto: string;
  /** Index into the products array (demoProducts). */
  readonly productIndex: number;
  readonly montoCentavos: bigint;
  readonly cantidad: number;
}

export const DEMO_SALE_TEMPLATES: readonly DemoSaleTemplate[] = [
  { concepto: 'Taco al Pastor', productIndex: 0, montoCentavos: 2_500n, cantidad: 1 },
  { concepto: 'Taco al Pastor x3', productIndex: 0, montoCentavos: 7_500n, cantidad: 3 },
  { concepto: 'Taco de Bistec', productIndex: 1, montoCentavos: 2_800n, cantidad: 1 },
  { concepto: 'Taco de Bistec x2', productIndex: 1, montoCentavos: 5_600n, cantidad: 2 },
  { concepto: 'Agua de Horchata 1L', productIndex: 2, montoCentavos: 3_500n, cantidad: 1 },
  { concepto: 'Torta de Milanesa', productIndex: 3, montoCentavos: 6_500n, cantidad: 1 },
  { concepto: 'Quesadilla', productIndex: 4, montoCentavos: 2_000n, cantidad: 1 },
  { concepto: 'Quesadilla x4', productIndex: 4, montoCentavos: 8_000n, cantidad: 4 },
  { concepto: 'Refresco lata', productIndex: 5, montoCentavos: 2_500n, cantidad: 1 },
  { concepto: 'Refresco lata x2', productIndex: 5, montoCentavos: 5_000n, cantidad: 2 },
] as const;

// ---------------------------------------------------------------------------
// Inventory stock quantities — initial "compra a proveedor" per product
// ---------------------------------------------------------------------------

export const INITIAL_STOCK: readonly number[] = [
  /* Taco Pastor   */ 0,  // low — triggers alert
  /* Taco Bistec   */ 50,
  /* Horchata      */ 8,
  /* Torta         */ 20,
  /* Quesadilla    */ 40,
  /* Refresco      */ 2,  // low — triggers alert
  /* Harina        */ 3,
  /* Aceite        */ 2,  // low — triggers alert
  /* Servilletas   */ 15,
  /* Salsa verde   */ 4,
  /* Tortilla maíz */ 10,
  /* Carne pastor  */ 1,  // low — triggers alert
] as const;
