/**
 * The board's third axis: how much an item matters, and whether production can
 * go live without it. Owner's ask of 2026-09-28, after a list of 162 sorted
 * only by area still did not say what to do first.
 *
 * **Both come from a tag, not from a guess.** A rule over the text can spot the
 * items a doc already calls BLOCKER, but not the ones that are simply broken in
 * production — no line in `11-pre-launch-and-deferred.md` says «BLOCKER» about
 * `CRON_SECRET`, yet without it the trial emails, the nightly usage recount and
 * the monthly CFDI close have never run. Those are judgements, so they are
 * written down in the track rather than inferred here, and an item with no tag
 * says so instead of being quietly filed as unimportant.
 */

import type { Item } from './plan-board-parse.js';

export const PRIORIDADES = ['critica', 'alta', 'media', 'baja'] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export const PRIO_TITULO: Readonly<Record<Prioridad, string>> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

/** What each level is for, so the next person tags the same way. */
export const PRIO_REGLA: Readonly<Record<Prioridad, string>> = {
  critica: 'Producción no sale sin esto, o ya está roto en producción hoy.',
  alta: 'Bloquea el lanzamiento, o destraba a varias otras.',
  media: 'Se necesita poco después de salir, o su disparador ya es cierto.',
  baja: 'Opcional, aplazada, o su disparador está lejos.',
};

const NIVEL = new Set<string>(PRIORIDADES);

/** The `` `[bloq]` `` tag: production cannot go live while this is open. */
export function esBloqueante(item: Item): boolean {
  return item.tags.includes('bloq');
}

/** The priority a track wrote, or null when nobody has judged it yet. */
export function prioridadDe(item: Item): Prioridad | null {
  return (item.tags.find((t) => NIVEL.has(t)) as Prioridad | undefined) ?? null;
}

/** Board order: critical first, untagged last — an unjudged item is not a low one. */
export function ordenPrioridad(item: Item): number {
  const p = prioridadDe(item);
  return p === null ? PRIORIDADES.length : PRIORIDADES.indexOf(p);
}
