/**
 * The board's second axis: **what kind of work** an open item is, beside the
 * `categoryOf` question of *when* it happens (see `plan-board-render.ts`).
 *
 * Owner's ask of 2026-09-28. The two axes answer different questions and the
 * board needs both: «Lanzamiento» says an item gates X-10, «papeleo» says no
 * engineer can move it. A list of 175 that mixes «counsel reviews the aviso»
 * with «build the ten Diagnóstico sections» cannot be planned from.
 *
 * An item's area comes from an explicit `` `[area]` `` tag in its title when it
 * has one, and otherwise from its file and section. The default carries most
 * tracks — a task in `04-portal.md` is product work — so only the exceptions
 * are written down, which is the point: a tag in a track file means «this one
 * is not what its neighbours are».
 */

import type { Item } from './plan-board-parse.js';

/** Board order: what only the owner can move first, the bulk of engineering last. */
export const AREAS = [
  'papeleo',
  'legal',
  'infra',
  'deuda',
  'tiendas',
  'terceros',
  'lanzamiento',
  'producto',
] as const;
export type Area = (typeof AREAS)[number];

/** Heading and one line of what belongs here, in board order. */
export const AREA_TITLES: Readonly<Record<Area, string>> = {
  papeleo: 'Papeleo del dueño',
  legal: 'Legal y cumplimiento',
  infra: 'Infraestructura y operación',
  deuda: 'Deuda técnica y auditorías',
  tiendas: 'Tiendas (App Store / Play)',
  terceros: 'Terceros y alianzas',
  lanzamiento: 'Coordinación de lanzamiento',
  producto: 'Producto',
};

export const AREA_BLURB: Readonly<Record<Area, string>> = {
  papeleo:
    'Sólo el dueño las mueve: cuentas, llaves, DNS, KYC, firmas. Ninguna se destraba escribiendo código.',
  legal: 'Textos, consentimiento y los derechos que el aviso promete. Varias esperan al abogado.',
  infra: 'Entornos, base de datos, regiones y respaldos. Se prueban en staging, no en local.',
  deuda: 'Auditorías, cobertura, arneses y reescrituras de prueba. Nada de esto es función nueva.',
  tiendas: 'Lo que Apple y Google exigen antes de la primera revisión.',
  terceros: 'Proveedores y alianzas: Clip, Mercado Pago, el PAC, los DPA.',
  lanzamiento: 'Coordinación: integración de punta a punta, beta, dogfooding y la compuerta X-10.',
  producto: 'Función nueva o por terminar, en el portal, la app, el backend o la consola.',
};

const KNOWN = new Set<string>(AREAS);

/** The area among an item's tags, or null when it carries none. */
function tagged(item: Item): Area | null {
  return (item.tags.find((t) => KNOWN.has(t)) as Area | undefined) ?? null;
}

/**
 * The production-readiness checklist, section by section. Most of it is
 * engineering with a legal deadline rather than paperwork: «cancel in one
 * click» and «self-service deletion» are screens somebody builds.
 */
function readinessArea(section: string): Area {
  if (section.startsWith('5.')) return 'tiendas';
  if (section.startsWith('6.')) return 'terceros';
  if (section.startsWith('8.')) return 'papeleo';
  return /^[2347]\./.test(section) ? 'producto' : 'legal';
}

/** What an item is, when nothing tagged it. Keyed on file + section, like `categoryOf`. */
function byOrigin(item: Item): Area {
  const { source, section, id } = item;
  if (source.endsWith('production-readiness.md')) return readinessArea(section);
  if (source === '11-pre-launch-and-deferred.md')
    return section.startsWith('1.') ? 'papeleo' : 'producto';
  if (source === '07-launch.md') return 'lanzamiento';
  return id?.startsWith('O-') ? 'papeleo' : 'producto';
}

export function areaOf(item: Item): Area {
  return tagged(item) ?? byOrigin(item);
}
