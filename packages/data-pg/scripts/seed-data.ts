/**
 * Seed fixtures — Taquería Don Pedro (B-04).
 *
 * The business every design file uses. Kept apart from the insert logic in
 * `seed.ts` so neither file carries both the data and the SQL (CLAUDE.md §2.6).
 */

export const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
export const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV';

export const TS = (d: string): string => `${d}T15:00:00.000Z`;
export const peso = (n: number): number => Math.round(n * 100);

/** Everything that predates the seeded week shares one creation stamp. */
export const CREATED = TS('2026-01-02');
export const TODAY = '2026-05-12';

/** `[id, nombre, sku, costoCentavos, precioCentavos, umbral, sigueStock]` */
export const PRODUCTS = [
  ['p-tac', 'Taco al pastor', 'TAC-001', 980, 2500, 40, true],
  ['p-que', 'Quesadilla', 'QUE-001', 3120, 4000, 20, true],
  ['p-gri', 'Gringa', 'GRI-001', 3850, 6000, 15, true],
  ['p-hor', 'Agua de horchata', 'BEB-001', 610, 2000, 8, true],
  ['p-ref', 'Refresco', 'BEB-002', 1200, 2500, 24, true],
  ['p-tor', 'Tortilla (kg)', 'MP-001', 2200, 0, 10, true],
] as const;

/** `[id, fecha, concepto, productoId, cantidad, montoCentavos, metodo]` */
export const SALES = [
  ['s1', '2026-05-12', 'Taco al pastor ×3', 'p-tac', 3, peso(75), 'Efectivo'],
  ['s2', '2026-05-12', 'Gringa', 'p-gri', 1, peso(60), 'Transferencia'],
  ['s3', '2026-05-12', 'Agua de horchata ×2', 'p-hor', 2, peso(60), 'QR/CoDi'],
  ['s4', '2026-05-11', 'Quesadilla ×2', 'p-que', 2, peso(80), 'Efectivo'],
  ['s5', '2026-05-11', 'Tacos al pastor ×10', 'p-tac', 10, peso(250), 'Efectivo'],
  ['s6', '2026-05-10', 'Gringa ×2', 'p-gri', 2, peso(120), 'Tarjeta'],
] as const;

/** `[id, fecha, concepto, categoria, montoCentavos]` */
export const EXPENSES = [
  ['e1', '2026-05-12', 'Queso Oaxaca 5 kg', 'Materia Prima', peso(420)],
  ['e2', '2026-05-12', 'Gas', 'Servicios', peso(340)],
  ['e3', '2026-05-11', 'Nómina semana 19', 'Nómina', peso(8150)],
  ['e4', '2026-05-08', 'Renta del local', 'Renta', peso(6000)],
  ['e5', '2026-05-08', 'Refrescos y aguas', 'Inventario', peso(1800)],
] as const;

/** `[id, productoId, fecha, tipo, cantidad, costoUnitCentavos]` */
export const MOVEMENTS = [
  ['m1', 'p-ref', '2026-05-08', 'entrada', 12, 1200],
  ['m2', 'p-tor', '2026-05-09', 'entrada', 3, 2200],
  ['m3', 'p-hor', '2026-05-10', 'entrada', 2, 610],
  ['m4', 'p-tac', '2026-05-08', 'entrada', 120, 980],
  ['m5', 'p-que', '2026-05-08', 'entrada', 64, 3120],
  ['m6', 'p-gri', '2026-05-08', 'entrada', 38, 3850],
] as const;

/** Cost per unit for the outbound movement each sale creates. */
export const COST: Readonly<Record<string, number>> = {
  'p-tac': 980,
  'p-que': 3120,
  'p-gri': 3850,
  'p-hor': 610,
  'p-ref': 1200,
  'p-tor': 2200,
};

/** `[id, nombre, avatarColor, puedeCancelar]` — operators sign in with a PIN. */
export const USERS = [
  ['u-ana', 'Ana Robledo', '#3B6FFF', true],
  ['u-luis', 'Luis Ortega', '#00C896', false],
] as const;

/** `[id, nombre, puesto, salarioSemanal, periodo]` */
export const EMPLOYEES = [
  ['emp-ana', 'Ana Robledo', 'Cajera', peso(2100), 'Semanal'],
  ['emp-luis', 'Luis Ortega', 'Parrillero', peso(2400), 'Semanal'],
  ['emp-rosa', 'Rosa Medina', 'Cocina', peso(1650), 'Semanal'],
  ['emp-jorge', 'Jorge Lara', 'Repartidor', peso(1200), 'Quincenal'],
  ['emp-carmen', 'Carmen Ruiz', 'Limpieza', peso(800), 'Semanal'],
] as const;

/** `[id, nombre, plataforma, modelo, lastPush]` */
export const DEVICES = [
  ['d-iphone', 'iPhone de caja', 'ios', 'iPhone 13', '2026-05-12'],
  ['d-android', 'Android de la barra', 'android', 'Moto G84', '2026-05-12'],
] as const;

/** `[id, source, severity, title, body, cta, href]` */
export const NOTICES = [
  [
    'nt-1',
    'operacion',
    'critical',
    'Discrepancia en el corte de caja',
    'El Android de la barra cerró con $6.00 menos de lo esperado.',
    'Ver corte',
    '/sincronizacion',
  ],
  [
    'nt-2',
    'operacion',
    'warning',
    '3 productos por debajo de su umbral',
    'Refresco, Tortilla (kg) y Agua de horchata necesitan reposición.',
    'Ver productos',
    '/productos',
  ],
  [
    'nt-3',
    'sistema',
    'info',
    'Se activó el lector de código de barras',
    'Ahora tus operadores pueden escanear productos con la cámara.',
    'Ver funciones',
    '/negocio',
  ],
  [
    'nt-4',
    'asesor',
    'warning',
    'El queso te cuesta 18% más que en junio',
    'Sigues vendiendo la quesadilla a $40.00. Tu margen bajó de 35% a 22%.',
    'Ver precio sugerido',
    '/productos',
  ],
] as const;

/** `[id, tableName, rowId, code, preview]` */
export const REJECTIONS = [
  ['rj-1', 'sales', 'sv-99', 'FK_PRODUCT_MISSING', 'Venta · Gringa ×1 · $60.00'],
  ['rj-2', 'inventory_movements', 'mv-99', 'HYBRID_UPDATE_FORBIDDEN', 'Ajuste · Refresco · −1'],
] as const;
