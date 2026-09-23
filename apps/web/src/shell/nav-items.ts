/**
 * The sidebar's eleven destinations (Revisión de caja joined with Track O, O-30).
 *
 * Order, the "Configuración" divider, and every icon path are copied from the
 * design files' `navDefs` — per the plan's starting instruction, "Toma cada
 * valor del archivo, no de tu memoria."
 *
 * **One deviation (ADR-092, owner decision 2026-09-22):** the files draw
 * Ventas/Gastos and Operadores/Dispositivos as two entries each, both pointing
 * at one screen with a different tab preselected. Two rows for one destination
 * cannot show which one you are on — the sidebar lit both — so each pair is a
 * single entry here and the tabs inside the screen do the switching. The
 * design files are to follow; until they do, this file is ahead of them.
 */
export interface NavItem {
  readonly label: string;
  readonly href: string;
  /** Lucide-idiom path data, drawn on a 24×24 viewBox at stroke-width 2.2. */
  readonly icon: string;
  readonly dividerAfter?: true;
  /** Other paths that light this item: Cortes de turno sits under Operadores (O-31). */
  readonly activeOn?: readonly string[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Inicio', href: '/', icon: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10' },
  {
    label: 'Asesor',
    href: '/asesor',
    icon: 'M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM18.6 15.4l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z',
  },
  {
    label: 'Ventas y gastos',
    href: '/movimientos',
    // The ledger's own glyph, from the files' Ventas entry.
    icon: 'M5 3h14v18l-3-2-2 2-2-2-2 2-3-2V3M9 8h6M9 12h6',
  },
  { label: 'Estados financieros', href: '/estados', icon: 'M4 20V4m0 16h16M8 16V11m4 5V7m4 9v-3' },
  {
    label: 'Productos',
    href: '/productos',
    icon: 'M21 8 12 3 3 8v8l9 5 9-5V8Zm-9 5L3 8m9 5 9-5m-9 5v8',
  },
  {
    label: 'Revisión de caja',
    href: '/revision-caja',
    icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  },
  {
    label: 'Tu equipo',
    href: '/equipo',
    // Cortes de turno hangs off this destination (O-31).
    activeOn: ['/cortes'],
    icon: 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 20v-1.5a3 3 0 0 0-2.5-3',
  },
  {
    label: 'Empleados',
    href: '/empleados',
    icon: 'M3 6h18v13H3V6Zm4 4h3v3H7v-3Zm7 0h4M14 14h4',
    dividerAfter: true,
  },
  {
    label: 'Sincronización',
    href: '/sincronizacion',
    icon: 'M21 11a9 9 0 0 0-15-5.5L3 8m0-5v5h5m-5 3a9 9 0 0 0 15 5.5l3-2.5m0 5v-5h-5',
  },
  { label: 'Negocio', href: '/negocio', icon: 'M4 9h16v11H4V9Zm0 0 2-5h12l2 5M9 20v-6h6v6' },
  { label: 'Suscripción', href: '/suscripcion', icon: 'M3 7h18v11H3V7Zm0 4h18M7 15h4' },
];
