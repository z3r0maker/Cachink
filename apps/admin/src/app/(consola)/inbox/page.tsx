import Link from 'next/link';
import type { Route } from 'next';

import { db } from '@/server/db/client';
import { drizzleSupportItems } from '@/server/db/support-items';
import { SupportItemError } from '@/server/inbox/errors';
import { listSupportItems, type ListResult } from '@/server/inbox/list';
import { requireStaffPage } from '@/server/staff';
import { body, buttonQuiet, errorText, heading } from '@/styles/ui.css';

import { FilterChips } from './filter-chips';
import { wide } from './inbox.css';
import { ItemList } from './item-list';
import { inboxHref, parseView, toListInput, type SearchParams } from './params';

/** N-08 · Inbox: every item that needs a human, newest first, filtered by chips. */
export const dynamic = 'force-dynamic';

async function load(input: unknown): Promise<ListResult | SupportItemError> {
  try {
    return await listSupportItems(drizzleSupportItems(db()), input);
  } catch (error) {
    if (error instanceof SupportItemError && error.code !== 'STORE_FAILED') return error;
    throw error;
  }
}

export default async function InboxPage(props: { searchParams: Promise<SearchParams> }) {
  const { staff } = await requireStaffPage();
  const sp = await props.searchParams;
  const view = parseView(sp);
  const cursor = typeof sp.cursor === 'string' ? sp.cursor : null;
  const result = await load(toListInput(view, staff.id, cursor));

  return (
    <section className={wide} aria-labelledby="inbox-title">
      <h1 id="inbox-title" className={heading}>
        Inbox
      </h1>
      <p className={body}>Soporte y escalaciones. Cada cambio queda en la bitácora del equipo.</p>
      <FilterChips view={view} />
      {result instanceof SupportItemError ? (
        <p role="alert" className={errorText}>
          {result.code === 'INVALID_CURSOR'
            ? 'Esa página ya no es válida.'
            : 'Ese filtro no es válido.'}{' '}
          <Link href="/inbox">Ver todo</Link>
        </p>
      ) : (
        <>
          <ItemList items={result.items} me={staff.id} />
          {result.nextCursor ? (
            <Link className={buttonQuiet} href={inboxHref(view, {}, result.nextCursor) as Route}>
              Siguientes
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
