import {
  SUPPORT_KINDS,
  SUPPORT_STATUSES,
  type StaffMemberId,
  type SupportKind,
  type SupportStatus,
} from '@xangarro/domain';

import { SAVED_FILTERS, type ListInput, type SavedFilter } from '@/server/inbox/list';

/** How many items each board column shows before «Ver todos». */
export const BOARD_COLUMN_LIMIT = 30;

import { one, oneOf, type SearchParams } from '../search-params';

/** The inbox's URL is its state: `?tipo=&estado=&urgente=1&mias=1&negocio=&filtro=&cursor=`. */
export type { SearchParams };

export interface InboxView {
  readonly tipo: SupportKind | null;
  readonly estado: SupportStatus | null;
  readonly urgente: boolean;
  readonly mias: boolean;
  readonly negocio: string | null;
  readonly filtro: SavedFilter | null;
}

export function parseView(sp: SearchParams): InboxView {
  return {
    tipo: oneOf(one(sp, 'tipo'), SUPPORT_KINDS),
    estado: oneOf(one(sp, 'estado'), SUPPORT_STATUSES),
    urgente: one(sp, 'urgente') === '1',
    mias: one(sp, 'mias') === '1',
    negocio: one(sp, 'negocio'),
    filtro: oneOf(one(sp, 'filtro'), Object.keys(SAVED_FILTERS) as SavedFilter[]),
  };
}

/** The use-case input for a view. A saved filter replaces the kind/status chips. */
export function toListInput(view: InboxView, me: StaffMemberId, cursor: string | null): ListInput {
  const saved = view.filtro ? SAVED_FILTERS[view.filtro].query : null;
  return {
    ...(saved ?? {
      ...(view.tipo ? { kinds: [view.tipo] } : {}),
      ...(view.estado ? { statuses: [view.estado] } : {}),
    }),
    ...(view.urgente ? { urgent: true } : {}),
    ...(view.mias ? { ownerStaffId: me } : {}),
    ...(view.negocio ? { businessId: view.negocio } : {}),
    ...(cursor ? { cursor } : {}),
  };
}

/** `/inbox?…` for `view` with `change` applied; the page cursor always resets. */
export function inboxHref(
  view: InboxView,
  change: Partial<InboxView> = {},
  cursor?: string,
): string {
  const v = { ...view, ...change };
  const q = new URLSearchParams();
  if (v.filtro) q.set('filtro', v.filtro);
  if (v.tipo && !v.filtro) q.set('tipo', v.tipo);
  if (v.estado && !v.filtro) q.set('estado', v.estado);
  if (v.urgente) q.set('urgente', '1');
  if (v.mias) q.set('mias', '1');
  if (v.negocio) q.set('negocio', v.negocio);
  if (cursor) q.set('cursor', cursor);
  const s = q.toString();
  return s === '' ? '/inbox' : `/inbox?${s}`;
}

/**
 * The board (one column per status) is the default view. A status chip, a
 * saved filter or a page cursor asks for a single list instead.
 */
export function isBoard(view: InboxView, cursor: string | null): boolean {
  return view.estado === null && view.filtro === null && cursor === null;
}

/** The use-case input for one board column: the view's chips plus that status. */
export function toColumnInput(
  view: InboxView,
  me: StaffMemberId,
  status: SupportStatus,
): ListInput {
  return { ...toListInput(view, me, null), statuses: [status], limit: BOARD_COLUMN_LIMIT };
}
