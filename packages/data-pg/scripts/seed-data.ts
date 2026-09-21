/**
 * Seed fixtures — Taquería Don Pedro (B-04).
 *
 * The business every design file uses. Kept apart from the insert logic in
 * `seed.ts` so neither file carries both the data and the SQL (CLAUDE.md §2.6).
 */

export const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
export const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV';

/**
 * Ids are ULIDs (ADR-010), minted on the device before the server sees them.
 *
 * They used to be short readable strings — `p-tac`, `s1` — which the Postgres
 * schema accepted because ids are `text`. The first write through
 * `EditarProductoUseCase` rejected them: `ProductSchema` requires a real ULID,
 * and no read path had ever validated a seeded row. Seed data that cannot pass
 * the domain's own schema is not a fixture, it is a trap.
 *
 * 21-character prefix + a 5-character mnemonic = 26, in Crockford base32
 * (no I, L, O or U).
 */
const ULID_PREFIX = '01HZ8XQN9GZJXV8AKQ5X0';
export const id = (suffix: string): string => `${ULID_PREFIX}${suffix}`;

export const TS = (d: string): string => `${d}T15:00:00.000Z`;
export const peso = (n: number): number => Math.round(n * 100);

/** Everything that predates the seeded week shares one creation stamp. */
export const CREATED = TS('2026-01-02');
export const TODAY = '2026-05-12';

/** `[id, nombre, sku, costoCentavos, precioCentavos, umbral, sigueStock]` */
export const PRODUCTS = [
  [id('PTAC1'), 'Taco al pastor', 'TAC-001', 980, 2500, 40, true],
  [id('PQSA1'), 'Quesadilla', 'QUE-001', 3120, 4000, 20, true],
  [id('PGRN1'), 'Gringa', 'GRI-001', 3850, 6000, 15, true],
  [id('PHRC1'), 'Agua de horchata', 'BEB-001', 610, 2000, 8, true],
  [id('PREF1'), 'Refresco', 'BEB-002', 1200, 2500, 24, true],
  [id('PTRT1'), 'Tortilla (kg)', 'MP-001', 2200, 0, 10, true],
] as const;

/** `[id, fecha, concepto, productoId, cantidad, montoCentavos, metodo]` */
export const SALES = [
  [id('S0001'), '2026-05-12', 'Taco al pastor ×3', id('PTAC1'), 3, peso(75), 'Efectivo'],
  [id('S0002'), '2026-05-12', 'Gringa', id('PGRN1'), 1, peso(60), 'Transferencia'],
  [id('S0003'), '2026-05-12', 'Agua de horchata ×2', id('PHRC1'), 2, peso(60), 'QR/CoDi'],
  [id('S0004'), '2026-05-11', 'Quesadilla ×2', id('PQSA1'), 2, peso(80), 'Efectivo'],
  [id('S0005'), '2026-05-11', 'Tacos al pastor ×10', id('PTAC1'), 10, peso(250), 'Efectivo'],
  [id('S0006'), '2026-05-10', 'Gringa ×2', id('PGRN1'), 2, peso(120), 'Tarjeta'],
] as const;

/** `[id, fecha, concepto, categoria, montoCentavos]` */
export const EXPENSES = [
  [id('E0001'), '2026-05-12', 'Queso Oaxaca 5 kg', 'Materia Prima', peso(420)],
  [id('E0002'), '2026-05-12', 'Gas', 'Servicios', peso(340)],
  [id('E0003'), '2026-05-11', 'Nómina semana 19', 'Nómina', peso(8150)],
  [id('E0004'), '2026-05-08', 'Renta del local', 'Renta', peso(6000)],
  [id('E0005'), '2026-05-08', 'Refrescos y aguas', 'Inventario', peso(1800)],
] as const;

/** `[id, productoId, fecha, tipo, cantidad, costoUnitCentavos]` */
export const MOVEMENTS = [
  [id('M0001'), id('PREF1'), '2026-05-08', 'entrada', 12, 1200],
  [id('M0002'), id('PTRT1'), '2026-05-09', 'entrada', 3, 2200],
  [id('M0003'), id('PHRC1'), '2026-05-10', 'entrada', 2, 610],
  [id('M0004'), id('PTAC1'), '2026-05-08', 'entrada', 120, 980],
  [id('M0005'), id('PQSA1'), '2026-05-08', 'entrada', 64, 3120],
  [id('M0006'), id('PGRN1'), '2026-05-08', 'entrada', 38, 3850],
] as const;

/** Cost per unit for the outbound movement each sale creates. */
export const COST: Readonly<Record<string, number>> = {
  [id('PTAC1')]: 980,
  [id('PQSA1')]: 3120,
  [id('PGRN1')]: 3850,
  [id('PHRC1')]: 610,
  [id('PREF1')]: 1200,
  [id('PTRT1')]: 2200,
};

/**
 * The outbound movement a sale creates, as a ULID derived from the sale's own.
 *
 * It used to be `'mv-' + saleId`, which is neither 26 characters nor Crockford
 * base32. Swapping the first character of the mnemonic keeps both.
 */
export const movementIdFor = (saleId: string): string =>
  `${saleId.slice(0, 21)}X${saleId.slice(22)}`;

/** The day close, and the device that owns the rejected rows. */
export const DAY_CLOSE_ID = id('DC001');
export const REJECTING_DEVICE = id('DAND1');

/** `[id, nombre, avatarColor, puedeCancelar]` — operators sign in with a PIN. */
export const USERS = [
  [id('ANA01'), 'Ana Robledo', '#3B6FFF', true],
  [id('EGA01'), 'Luis Ortega', '#00C896', false],
] as const;

/** `[id, nombre, telefono, limiteCentavos, plazoDias]` — the fiado clients (O-33). */
export const CLIENTS = [
  [id('CDMAR'), 'Doña Mari de la tienda', '5512 447 903', peso(800), 7],
  [id('CRCZA'), 'Raúl Contreras', '5521 836 441', peso(500), 15],
] as const;

/** `[id, nombre, puesto, salarioSemanal, periodo]` */
export const EMPLOYEES = [
  [id('EMP01'), 'Ana Robledo', 'Cajera', peso(2100), 'semanal'],
  [id('EMP02'), 'Luis Ortega', 'Parrillero', peso(2400), 'semanal'],
  [id('EMP03'), 'Rosa Medina', 'Cocina', peso(1650), 'semanal'],
  [id('EMP04'), 'Jorge Lara', 'Repartidor', peso(1200), 'quincenal'],
  [id('EMP05'), 'Carmen Ruiz', 'Limpieza', peso(800), 'semanal'],
] as const;

/** `[id, nombre, plataforma, modelo, lastPush]` */
export const DEVICES = [
  [id('DPH01'), 'iPhone de caja', 'ios', 'iPhone 13', '2026-05-12'],
  [id('DAND1'), 'Android de la barra', 'android', 'Moto G84', '2026-05-12'],
] as const;

/** `[id, source, severity, title, body, cta, href]` */
export const NOTICES = [
  [
    id('NT001'),
    'operacion',
    'critical',
    'Discrepancia en el corte de caja',
    'El Android de la barra cerró con $6.00 menos de lo esperado.',
    'Ver corte',
    '/sincronizacion',
  ],
  [
    id('NT002'),
    'operacion',
    'warning',
    '3 productos por debajo de su umbral',
    'Refresco, Tortilla (kg) y Agua de horchata necesitan reposición.',
    'Ver productos',
    '/productos',
  ],
  [
    id('NT003'),
    'sistema',
    'info',
    'Se activó el lector de código de barras',
    'Ahora tus operadores pueden escanear productos con la cámara.',
    'Ver funciones',
    '/negocio',
  ],
  [
    id('NT004'),
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
  [id('RJ001'), 'sales', id('SV099'), 'FK_PRODUCT_MISSING', 'Venta · Gringa ×1 · $60.00'],
  [
    id('RJ002'),
    'inventory_movements',
    id('MV099'),
    'HYBRID_UPDATE_FORBIDDEN',
    'Ajuste · Refresco · −1',
  ],
] as const;

/**
 * The portal's owner.
 *
 * A UUID because `auth.users.id` is Supabase's shape; the device-minted ULIDs
 * elsewhere are a different id space and deliberately not mixed with it.
 * The password is a fixture — local development and E2E only.
 */
export const OWNER = {
  id: '3f1c0e2a-0000-4000-8000-000000000001',
  email: 'pedro@taqueria.mx',
  password: 'donpedro123',
  nombre: 'Pedro',
  memberId: id('MEMB1'),
  role: 'owner',
} as const;

/** A read-only member, so role gating has something real to gate. */
export const VIEWER = {
  id: '3f1c0e2a-0000-4000-8000-000000000002',
  email: 'contador@taqueria.mx',
  password: 'contador123',
  nombre: 'Laura',
  memberId: id('MEMB2'),
  role: 'viewer',
} as const;

/**
 * The Equipo Operativo login: an `admin`-role member who can work the
 * business day to day but hits every owner-only gate (billing, archive).
 */
export const OPERADOR = {
  id: '3f1c0e2a-0000-4000-8000-000000000003',
  email: 'operador@taqueria.mx',
  password: 'operador123',
  nombre: 'Operador',
  memberId: id('MEMB3'),
  role: 'admin',
} as const;

/**
 * A second tenant, used only by the contract conformance suite.
 *
 * Conformance activates real devices, and Taquería Don Pedro is seeded at its
 * plan's device limit — realistic, and exactly what makes it unusable for a
 * suite that needs activations to succeed. Revoking the demo business's phones
 * before each run would silently rewrite the data every screen is tested
 * against, so conformance gets its own business instead, with one operator and
 * one product because the happy path asserts both arrive in the bootstrap.
 *
 * It is also a second tenant in the seed, which the RLS suite already wanted.
 */
export const CONFORMANCE = {
  businessId: id('CNF01'),
  email: 'conformance@xangarro.mx',
  productId: id('CNFP1'),
  userId: id('CNFW1'),
} as const;
