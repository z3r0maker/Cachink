/**
 * Which door the visitor chose, as a search param.
 *
 * Its own module, with no `'use client'`, because both sides read it: the
 * server page decides what to render from it and the client door writes it.
 * Exported from `door.tsx` it was a client reference on the server — not the
 * string — so the comparison silently never matched and the form never
 * appeared.
 */
export const PUERTA = 'puerta';
export const PUERTA_DUENO = 'dueno';

/** `/login?puerta=dueno` — the member form. */
export const rutaDeDueno = `/login?${PUERTA}=${PUERTA_DUENO}` as const;
