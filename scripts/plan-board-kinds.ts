/**
 * The kind-of-work cut behind `docs/plan/PENDIENTES.md` — the owner's ask of
 * 2026-10-05: four lists that say who has to act, not when in the launch the
 * work lands (the launch phase survives as the per-item tag in «Siguiente»).
 *
 * Every open item is classified explicitly — by id when it has one, by
 * §section (plus a title prefix for the odd ones out) for the id-less
 * `production-readiness.md` rows — and `kindOf` throws on anything else, so a
 * new task gets its bucket the day it is written. Mixed items (staging: repo
 * docs vs hosted project) sit where their blocking half is; the next action
 * decides.
 */

import type { Item } from './plan-board-parse.js';

export const KINDS = [
  'Código y técnico',
  'Corporativo, legal y terceros',
  'Infra y consolas',
  'Espera datos reales',
] as const;
export type Kind = (typeof KINDS)[number];

/** Surfaces subdivide «Código y técnico» only: the phone work stays visible
 * without mixing a surface cut into the kind cut. */
export const SURFACES = [
  'Teléfono',
  'Portal',
  'Caja web',
  'Pagos y conciliación',
  'Consola (backoffice)',
  'Backend, sync y datos',
  'Privacidad y LFPC',
  'Auditorías y calidad',
  'Lanzamiento, stores e integración',
  'Landing',
] as const;
export type Surface = (typeof SURFACES)[number];

export interface Classified {
  readonly kind: Kind;
  /** Set for «Código y técnico» only; the other kinds act outside the repo. */
  readonly surface: Surface | null;
}

const CORP: Classified = { kind: 'Corporativo, legal y terceros', surface: null };
const INFRA: Classified = { kind: 'Infra y consolas', surface: null };
const WAIT: Classified = { kind: 'Espera datos reales', surface: null };
const code = (surface: Surface): Classified => ({ kind: 'Código y técnico', surface });
const PRIVACIDAD = code('Privacidad y LFPC');
const STORES = code('Lanzamiento, stores e integración');
const BACKEND = code('Backend, sync y datos');
const PHONE = code('Teléfono');

/** One whitespace-separated string keeps the tables dense and diff-friendly. */
const ids = (text: string): readonly string[] => text.trim().split(/\s+/);

/** Razón social, abogado y contador, SAT/IMPI/INDAUTOR, seguros, Clip y
 * Mercado Pago, y las decisiones de negocio (folded here by the owner). */
const CORPORATE = new Set(
  ids('X-07 X-08 O-14 O-15 O-16 O-17 O-18 O-19 O-27 O-28 O-29 O-32 N-40 N-45 N-50 Z-12 L-09 L-10'),
);

/** Configuration in third-party consoles: Vercel, Supabase, Stripe, Resend,
 * DNS, GitHub. The repo already carries everything these need. */
const CONSOLES = new Set(
  ids('X-01 L-04 O-2 O-3 O-4 O-5 O-6 O-7 O-8 O-9 O-10 O-11 O-12 O-13 O-22 O-23 O-30 O-31'),
);

/** Cannot start until the world delivers: real customers, telemetry, scale
 * thresholds, or time after launch. Each carries its Trigger in the track. */
const WAITS = new Set(
  ids('X-04 N-30 Z-01 Z-02 Z-04 Z-05 Z-07 Z-08 Z-11 N-51 N-52 N-54 N-63 N-64 N-71 N-72 N-73 N-74'),
);

const BY_SURFACE: Readonly<Record<Surface, readonly string[]>> = {
  Teléfono: ids('N-19 N-21 N-22 N-24 N-25 A-16 M-08 M-09 M-10 M-11 M-12 DS-10'),
  Portal: ids(
    'N-03 N-12 P-21 P-23 P-28 P-29 P-30 P-35 P-36 P-38 P-39 P-40 P-41 DS-01 DS-02 DS-03 DS-04 DS-09',
  ),
  'Caja web': ids('P-37 DS-05 DS-06 DS-07 DS-08'),
  'Pagos y conciliación': ids('C-13 N-75 N-41 N-43 N-76 N-77 N-80 N-42 N-79 N-44 N-78 N-53'),
  'Consola (backoffice)': ids('N-46 N-62 N-65 N-66 N-67 N-68 N-70 B-16'),
  'Backend, sync y datos': ids('C-21 N-47 N-48 N-69'),
  'Privacidad y LFPC': ids('N-34 N-60'),
  'Auditorías y calidad': ids('N-26 N-27 N-28 N-29 N-49'),
  'Lanzamiento, stores e integración': ids('X-02 X-03 X-05 X-09 X-10 N-32'),
  Landing: ids('N-58 L-05'),
};

/** `production-readiness.md` rows carry no id: the §section decides, except
 * the prefixes below. Titles are stable — the board regenerates from the same
 * lines these match, and the committed-board test catches a rename. */
const PR_TITLE: readonly (readonly [string, Classified])[] = [
  ['Retirar `docs/legal/privacy.md`', PRIVACIDAD],
  ['Llenar las tres celdas `[PAÍS]`', PRIVACIDAD],
  ['Decidir casilla vs. botón', CORP],
  ['Protocolo de brechas', CORP],
  ['En la app «Desvincular', PHONE],
  ['ANTES DE STORES — Apple', INFRA],
  ['DPAs firmados', CORP],
  ['Opción de hosting de Foundry', CORP],
  ['`ASESOR_LLM_*`', BACKEND],
  ['Regla: la frontera', BACKEND],
  ['Afirmaciones publicitarias', CORP],
];

const PR_SECTION: readonly (readonly [string, Classified])[] = [
  ['0.', CORP],
  ['1.', CORP],
  ['2.', PRIVACIDAD],
  ['3.', PRIVACIDAD],
  ['4.', PRIVACIDAD],
  ['5.', STORES],
  ['6.', CORP],
  ['7.', PRIVACIDAD],
  ['8.', CORP],
  ['9.', CORP],
];

function byId(id: string): Classified | null {
  if (CORPORATE.has(id)) return CORP;
  if (CONSOLES.has(id)) return INFRA;
  if (WAITS.has(id)) return WAIT;
  const surface = SURFACES.find((s) => BY_SURFACE[s].includes(id));
  return surface ? code(surface) : null;
}

function productionReadiness(item: Item): Classified | null {
  const byTitle = PR_TITLE.find(([prefix]) => item.title.startsWith(prefix));
  if (byTitle) return byTitle[1];
  const bySection = PR_SECTION.find(([sec]) => item.section.startsWith(sec));
  return bySection ? bySection[1] : null;
}

export function kindOf(item: Item): Classified {
  const found =
    (item.id ? byId(item.id) : null) ??
    (item.source.endsWith('production-readiness.md') ? productionReadiness(item) : null);
  if (found) return found;
  throw new Error(
    `No bucket for ${item.id ?? `"${item.title}"`} (${item.source}:${item.line}) — add it to scripts/plan-board-kinds.ts`,
  );
}
