import Link from 'next/link';
import type { Route } from 'next';
import { SUPPORT_STATUSES, type StaffMemberId } from '@xangarro/domain';

import { db } from '@/server/db/client';
import { drizzleSupportItems } from '@/server/db/support-items';
import { SupportItemError } from '@/server/inbox/errors';
import { listSupportItems, type ListResult } from '@/server/inbox/list';
import { requireStaffPage } from '@/server/staff';
import { body, buttonQuiet, errorText, heading } from '@/styles/ui.css';

import { Board, type BoardColumns } from './board';
import { page } from './board.css';
import { FilterChips } from './filter-chips';
import { wide } from './inbox.css';
import { ItemList } from './item-list';
import {
  inboxHref,
  isBoard,
  parseView,
  toColumnInput,
  toListInput,
  type InboxView,
  type SearchParams,
} from './params';

/** N-08 · Inbox: a board by status by default; a status chip or saved filter shows one list. */
export const dynamic = 'force-dynamic';

async function load(input: unknown): Promise<ListResult | SupportItemError> {
  try {
    return await listSupportItems(drizzleSupportItems(db()), input);
  } catch (error) {
    if (error instanceof SupportItemError && error.code !== 'STORE_FAILED') return error;
    throw error;
  }
}

async function loadBoard(
  view: InboxView,
  me: StaffMemberId,
): Promise<BoardColumns | SupportItemError> {
  const results = await Promise.all(
    SUPPORT_STATUSES.map((st) => load(toColumnInput(view, me, st))),
  );
  const failed = results.find((r) => r instanceof SupportItemError);
  if (failed) return failed;
  const [nuevo, en_curso, resuelto] = results as ListResult[];
  return { nuevo: nuevo!, en_curso: en_curso!, resuelto: resuelto! };
}

function Failure({ error }: { readonly error: SupportItemError }) {
  return (
    <p role="alert" className={errorText}>
      {error.code === 'INVALID_CURSOR' ? 'Esa página ya no es válida.' : 'Ese filtro no es válido.'}{' '}
      <Link href="/inbox">Ver todo</Link>
    </p>
  );
}

function List(props: {
  readonly result: ListResult;
  readonly view: InboxView;
  readonly me: StaffMemberId;
}) {
  const next = props.result.nextCursor;
  return (
    <>
      <ItemList items={props.result.items} me={props.me} />
      {next ? (
        <Link className={buttonQuiet} href={inboxHref(props.view, {}, next) as Route}>
          Siguientes
        </Link>
      ) : null}
    </>
  );
}

async function Contents(props: {
  readonly view: InboxView;
  readonly me: StaffMemberId;
  readonly cursor: string | null;
}) {
  const { view, me, cursor } = props;
  if (isBoard(view, cursor)) {
    const columns = await loadBoard(view, me);
    if (columns instanceof SupportItemError) return <Failure error={columns} />;
    return <Board columns={columns} view={view} me={me} />;
  }
  const result = await load(toListInput(view, me, cursor));
  if (result instanceof SupportItemError) return <Failure error={result} />;
  return <List result={result} view={view} me={me} />;
}

export default async function InboxPage(props: { searchParams: Promise<SearchParams> }) {
  const { staff } = await requireStaffPage();
  const sp = await props.searchParams;
  const view = parseView(sp);
  const cursor = typeof sp.cursor === 'string' ? sp.cursor : null;

  return (
    <section className={isBoard(view, cursor) ? page : wide} aria-labelledby="inbox-title">
      <h1 id="inbox-title" className={heading}>
        Inbox
      </h1>
      <p className={body}>Soporte y escalaciones. Cada cambio queda en la bitácora del equipo.</p>
      <FilterChips view={view} />
      <Contents view={view} me={staff.id} cursor={cursor} />
    </section>
  );
}
