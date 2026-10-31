/**
 * «Empresa», MEXIA's command center (ADR-125), as the founders navigate it
 * (plan §2, canvas «Ronda 7 · Navegación»): each rail entry answers one
 * question and its screens are tabs. The full map is six entries (Resumen,
 * Dinero, Resultados, Socios, Cumplimiento, Propuestas); an entry or a tab
 * joins this list when its task ships, never before (CLAUDE.md §7: no
 * «Pronto»). Routes never change: a tab is a link to the screen's own URL.
 */
export type EmpresaHref =
  | '/empresa/movimientos'
  | '/empresa/facturas'
  | '/empresa/socios'
  | '/empresa/agenda'
  | '/empresa/expediente'
  | '/empresa/corporativo';

/** The rail entries built so far; their icons live in `icons.tsx`. */
export type EmpresaEntryId = 'dinero' | 'socios' | 'cumplimiento';

export interface EmpresaTab {
  readonly label: string;
  readonly href: EmpresaHref;
  readonly task: string;
}

export interface EmpresaEntry {
  readonly id: EmpresaEntryId;
  readonly label: string;
  readonly summary: string;
  /** The rail link opens the first tab. */
  readonly tabs: readonly [EmpresaTab, ...EmpresaTab[]];
}

export const EMPRESA_NAV: readonly EmpresaEntry[] = [
  {
    id: 'dinero',
    label: 'Dinero',
    summary: '¿Qué entró, qué salió y cuánto nos queda?',
    tabs: [
      { label: 'Movimientos', href: '/empresa/movimientos', task: 'E-02' },
      { label: 'Facturas', href: '/empresa/facturas', task: 'E-11' },
    ],
  },
  {
    id: 'socios',
    label: 'Socios',
    summary: '¿Qué puso, prometió y entregó cada socio?',
    tabs: [{ label: 'Cuentas', href: '/empresa/socios', task: 'E-03' }],
  },
  {
    id: 'cumplimiento',
    label: 'Cumplimiento',
    summary: '¿Qué vence, cerramos el mes y dónde está cada papel?',
    tabs: [
      { label: 'Agenda', href: '/empresa/agenda', task: 'E-04' },
      { label: 'Expediente', href: '/empresa/expediente', task: 'E-05' },
      { label: 'Corporativo', href: '/empresa/corporativo', task: 'E-06' },
    ],
  },
] as const;

const onRoute = (href: EmpresaHref, pathname: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

/** An entry is active on any of its tabs' routes, sub-pages included. */
export function isEntryActive(entry: EmpresaEntry, pathname: string): boolean {
  return entry.tabs.some((t) => onRoute(t.href, pathname));
}

/** The entry that owns a tab's route; none once that screen leaves the list. */
export function entryOf(href: EmpresaHref): EmpresaEntry | undefined {
  return EMPRESA_NAV.find((e) => e.tabs.some((t) => t.href === href));
}
