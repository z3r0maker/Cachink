/**
 * The portal's destinations, grouped by the question the owner is asking
 * (ADR-107, «El Mostrador»): what happened today, what Don Cuentas sees, the
 * money, the shop, the people. Settings (Negocio, Sincronización, Suscripción)
 * live in the account menu, not here.
 *
 * ADR-092 still holds: one entry per screen; tabs inside a screen switch its
 * view. Icons are Lucide-idiom path data, drawn on a 24×24 viewBox.
 */
export interface NavItem {
  readonly label: string;
  readonly href: string;
  /** Lucide-idiom path data, drawn on a 24×24 viewBox at stroke-width 2.2. */
  readonly icon: string;
  /** Other paths that light this item: Cortes de turno sits under Equipo y nómina (O-31). */
  readonly activeOn?: readonly string[];
  /** Draw Don Cuentas's face instead of the icon. */
  readonly avatar?: true;
}

export interface NavGroup {
  /** Null for the ungrouped top of the list. */
  readonly label: string | null;
  readonly items: readonly NavItem[];
}

const ICON = {
  hoy: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10',
  don: 'M5.5 10a2.8 2.8 0 1 0 5.6 0 2.8 2.8 0 1 0-5.6 0M12.9 10a2.8 2.8 0 1 0 5.6 0 2.8 2.8 0 1 0-5.6 0M11.1 10h1.8M6 16.5c2-2 4-2 6-.3 2-1.7 4-1.7 6 .3',
  ventas: 'M5 3h14v18l-3-2-2 2-2-2-2 2-3-2V3M9 8h6M9 12h6',
  estados: 'M4 20V4m0 16h16M8 16V11m4 5V7m4 9v-3',
  productos: 'M21 8 12 3 3 8v8l9 5 9-5V8Zm-9 5L3 8m9 5 9-5m-9 5v8',
  revision: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  equipo: 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 20v-1.5a3 3 0 0 0-2.5-3',
  negocio: 'M4 9h16v11H4V9Zm0 0 2-5h12l2 5M9 20v-6h6v6',
  plan: 'M3 7h18v11H3V7Zm0 4h18M7 15h4',
  sync: 'M21 11a9 9 0 0 0-15-5.5L3 8m0-5v5h5m-5 3a9 9 0 0 0 15 5.5l3-2.5m0 5v-5h-5',
  ayuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  privacidad:
    'M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1ZM9 12l2 2 4-4',
} as const;

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: null,
    items: [
      { label: 'Hoy', href: '/', icon: ICON.hoy },
      // Owner decision 2026-09-24: the advisor is «Don Cuentas»; the route stays /asesor.
      { label: 'Don Cuentas', href: '/asesor', icon: ICON.don, avatar: true },
    ],
  },
  {
    label: 'Dinero',
    items: [
      { label: 'Ventas y gastos', href: '/movimientos', icon: ICON.ventas },
      { label: 'Estados financieros', href: '/estados', icon: ICON.estados },
    ],
  },
  {
    label: 'Mi tiendita',
    items: [
      { label: 'Productos', href: '/productos', icon: ICON.productos },
      { label: 'Revisión de caja', href: '/revision-caja', icon: ICON.revision },
    ],
  },
  {
    label: 'Mi gente',
    items: [
      // ADR-107: the cashier and the employee are one person — one page.
      {
        label: 'Equipo y nómina',
        href: '/equipo',
        icon: ICON.equipo,
        activeOn: ['/cortes', '/empleados'],
      },
    ],
  },
];

/** Every sidebar destination, in order. */
export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** The account menu's destinations: the business's settings and help. */
export const ACCOUNT_ITEMS: readonly NavItem[] = [
  { label: 'Mi negocio', href: '/negocio', icon: ICON.negocio },
  { label: 'Plan y pagos', href: '/suscripcion', icon: ICON.plan },
  { label: 'Sincronización', href: '/sincronizacion', icon: ICON.sync },
  { label: 'Ayuda', href: '/ayuda', icon: ICON.ayuda },
];

export const PRIVACY_ICON = ICON.privacidad;
export const AYUDA_ICON = ICON.ayuda;
