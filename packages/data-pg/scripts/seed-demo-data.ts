/**
 * The App Review tenant, "Tacos La Esquina" (B-04, X-05).
 *
 * A second business, separate from the dev seed, that a store reviewer can
 * sign into and pair a phone with. Ids are ULIDs under their own prefix so
 * the two tenants can never collide; the prefix is Crockford base32 (no I, L,
 * O, U), which is also why the activation code is `DEMXK7M3` and not
 * `DEMOK7M3` — the code alphabet excludes O too (`ACTIVATION_CODE_REGEX`).
 */

const PREFIX = '01HZDEMK7M3APPREV1EW0'; // 21 chars + a 5-char suffix = a 26-char ULID
export const demoId = (suffix: string): string => `${PREFIX}${suffix.padStart(5, '0')}`;

export const DEMO = {
  businessId: demoId('B1Z00'),
  deviceId: demoId('DEV00'),
  nombre: 'Tacos La Esquina',
  owner: {
    id: '3f1c0e2a-0000-4000-8000-0000000000de',
    email: 'demo@xangarro.mx',
    nombre: 'Reviewer',
    memberId: demoId('MEMB0'),
  },
  /** Matches `ACTIVATION_CODE_REGEX`; re-minted on every run. */
  activationCode: 'DEMXK7M3',
  /** Two registers, the PINs the review notes state. */
  operators: [
    { id: demoId('USER1'), nombre: 'Lupita', pin: '1234', color: '#3B6FFF' },
    { id: demoId('USER2'), nombre: 'Chuy', pin: '5678', color: '#FF7A00' },
  ],
} as const;

/** [suffix, nombre, sku, costo, precio, icono] — 20 products a taquería sells. */
export const DEMO_PRODUCTS = [
  ['P0001', 'Taco de pastor', 'TAC-PAS', 900, 2200, 'beef'],
  ['P0002', 'Taco de bistec', 'TAC-BIS', 1100, 2500, 'beef'],
  ['P0003', 'Taco de suadero', 'TAC-SUA', 1000, 2300, 'beef'],
  ['P0004', 'Taco campechano', 'TAC-CAM', 1200, 2600, 'beef'],
  ['P0005', 'Gringa', 'GRI-001', 1800, 4500, 'beef'],
  ['P0006', 'Quesadilla', 'QUE-001', 1200, 3200, 'cake'],
  ['P0007', 'Torta de pastor', 'TOR-PAS', 2000, 5500, 'beef'],
  ['P0008', 'Alambre', 'ALA-001', 3500, 9800, 'beef'],
  ['P0009', 'Orden de guacamole', 'GUA-001', 1500, 4000, 'apple'],
  ['P0010', 'Cebollitas', 'CEB-001', 400, 1500, 'apple'],
  ['P0011', 'Agua de horchata', 'AGU-HOR', 500, 2000, 'candy'],
  ['P0012', 'Agua de jamaica', 'AGU-JAM', 500, 2000, 'candy'],
  ['P0013', 'Refresco', 'REF-001', 1200, 2500, 'candy'],
  ['P0014', 'Agua embotellada', 'AGU-BOT', 600, 1500, 'candy'],
  ['P0015', 'Cerveza', 'CER-001', 1800, 4000, 'candy'],
  ['P0016', 'Flan', 'FLA-001', 900, 3000, 'cake'],
  ['P0017', 'Arroz con leche', 'ARR-001', 700, 2500, 'cake'],
  ['P0018', 'Salsa extra', 'SAL-001', 200, 800, 'apple'],
  ['P0019', 'Tortillas extra', 'TOR-EXT', 300, 1000, 'cookie'],
  ['P0020', 'Consomé', 'CON-001', 800, 3000, 'beef'],
] as const;

/** [suffix, nombre, telefono, límite, plazo]. */
export const DEMO_CLIENTS = [
  ['C0001', 'Doña Chelo', '5551234567', 50_000, 15],
  ['C0002', 'Taller El Güero', '5559876543', 150_000, 30],
  ['C0003', 'Oficina Contadores SA', '5555555555', 300_000, 30],
] as const;

/** [nombre, categoría, monto] — repeated across the month. */
export const DEMO_EXPENSES = [
  ['Carne de pastor', 'Materia Prima', 185_000],
  ['Tortillas', 'Materia Prima', 42_000],
  ['Gas LP', 'Servicios', 68_000],
  ['Renta del local', 'Renta', 850_000],
  ['Luz', 'Servicios', 39_000],
  ['Verdura y fruta', 'Materia Prima', 56_000],
  ['Desechables', 'Otro', 31_000],
  ['Nómina semanal', 'Nómina', 420_000],
  ['Anuncio en redes', 'Publicidad', 25_000],
  ['Reparación de plancha', 'Mantenimiento', 60_000],
] as const;

export const DEMO_METODOS = [
  'Efectivo',
  'Efectivo',
  'Tarjeta',
  'Transferencia',
  'QR/CoDi',
] as const;

/** `YYYY-MM-DD` for `today − daysAgo`, in UTC — the seed's dates are days, not instants. */
export function dayBefore(today: Date, daysAgo: number): string {
  const d = new Date(today.getTime() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 10);
}
