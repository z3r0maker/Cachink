/**
 * Every product route the portal serves, and how to tell it loaded.
 *
 * The `data` field is **required**, not optional. Until this existed, all 79
 * specs passed against a portal with no database at all: every page catches its
 * loader's throw and renders the `error` state, and every `<h1>` sits outside
 * `ScreenBody`, so the heading assertion and the axe sweep were both satisfied
 * by a three-element error card. An optional field would let the next route
 * added quietly opt back into that; a required union makes forgetting a
 * compile error.
 *
 * Sentinels are traced to `packages/data-pg/scripts/seed-data.ts`. Two traps:
 *   - `Taquería Don Pedro` is NOT usable — it is hardcoded in the shell
 *     (`src/app/(portal)/layout.tsx`), so it appears on every route regardless
 *     of the database.
 *   - Assertions must be scoped to `<main>`, or hardcoded shell strings satisfy
 *     them. `expectSeededData` does that.
 */

export type RouteData =
  /** Renders seeded rows. `sentinel` appears ONLY when data loaded. */
  | { readonly kind: 'db'; readonly sentinel: string | RegExp }
  /** Reads no database. `reason` cites the file that proves it. */
  | { readonly kind: 'fixture'; readonly reason: string };

export interface Route {
  readonly path: string;
  readonly heading: string;
  readonly data: RouteData;
}

/** `/inventario` is dev scaffolding and deliberately absent. */
export const ROUTES: readonly Route[] = [
  // `recentActivity` → `_inicio/cards.tsx`; SALES s1.
  { path: '/', heading: 'Hola, Pedro', data: { kind: 'db', sentinel: 'Taco al pastor ×3' } },
  // NOTICES nt-4, the only `source='asesor'` row. `/asesor` opens on the
  // "Para ti" tab, which is db-backed; Diagnóstico's `locked` state is behind a
  // tab click and is not what loads here.
  {
    path: '/asesor',
    heading: 'Asesor',
    data: { kind: 'db', sentinel: 'El queso te cuesta 18% más que en junio' },
  },
  // Default tab is `ventas`; SALES s1.
  {
    path: '/movimientos',
    heading: 'Movimientos',
    data: { kind: 'db', sentinel: 'Taco al pastor ×3' },
  },
  // Ingresos for May 2026 = 75+60+60+80+250+120. A regex, not a string: every
  // label on this screen is static, so the only real-data signal is a figure,
  // and `formatMoney` goes through `Intl.NumberFormat` — ICU-version sensitive.
  { path: '/estados', heading: 'Estados financieros', data: { kind: 'db', sentinel: /645/ } },
  // PRODUCTS p-tac sku → `productos/columns.tsx`.
  { path: '/productos', heading: 'Productos', data: { kind: 'db', sentinel: 'TAC-001' } },
  {
    path: '/revision-caja',
    heading: 'Revisión de caja',
    data: { kind: 'fixture', reason: 'fixture until C-18 — revision-caja/page.tsx' },
  },
  {
    path: '/cortes',
    heading: 'Cortes de turno',
    data: { kind: 'fixture', reason: 'fixture until C-18 — cortes/page.tsx' },
  },
  // USERS u-ana; default tab `operadores`.
  { path: '/equipo', heading: 'Tu equipo', data: { kind: 'db', sentinel: 'Ana Robledo' } },
  // EMPLOYEES emp-rosa — deliberately not Ana, who is also a USER, so this
  // cannot pass by reading the wrong table.
  { path: '/empleados', heading: 'Empleados', data: { kind: 'db', sentinel: 'Rosa Medina' } },
  // NOTICES nt-1.
  {
    path: '/avisos',
    heading: 'Avisos',
    data: { kind: 'db', sentinel: 'Discrepancia en el corte de caja' },
  },
  // REJECTIONS rj-1 payload preview.
  {
    path: '/sincronizacion',
    heading: 'Sincronización',
    data: { kind: 'db', sentinel: 'Venta · Gringa ×1 · $60.00' },
  },
  // `businesses.regimen_fiscal` → `negocio/screen.tsx`.
  { path: '/negocio', heading: 'Negocio', data: { kind: 'db', sentinel: 'RESICO' } },
  {
    path: '/suscripcion',
    heading: 'Suscripción',
    data: { kind: 'fixture', reason: 'reads no database — suscripcion/page.tsx' },
  },
];
