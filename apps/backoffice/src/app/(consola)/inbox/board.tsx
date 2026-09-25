import Link from 'next/link';
import type { Route } from 'next';
import type { StaffMemberId, SupportItem, SupportStatus } from '@xangarro/domain';
import { SUPPORT_STATUSES } from '@xangarro/domain';

import { DonPortrait } from '@/components/don-cuentas/don-cuentas';
import type { ListResult } from '@/server/inbox/list';
import { formatDueDay, formatInstant, KIND_LABELS, STATUS_LABELS } from '@/server/inbox/labels';
import { led, type Led } from '@/shell/shell.css';

import * as s from './board.css';
import { meta, pill, rowTitle, urgentBadge } from './inbox.css';
import { inboxHref, type InboxView } from './params';

export type BoardColumns = Readonly<Record<SupportStatus, ListResult>>;

const LED: Record<SupportStatus, Led> = { nuevo: 'warn', en_curso: 'ok', resuelto: 'off' };

const EMPTY: Record<SupportStatus, string> = {
  nuevo: 'Nada nuevo por aquí.',
  en_curso: 'Nadie trabajando en nada. Sospechoso.',
  resuelto: 'Lo resuelto más reciente aparece aquí.',
};

function owner(item: SupportItem, me: StaffMemberId): string {
  if (item.ownerStaffId === null) return 'sin asignar';
  return item.ownerStaffId === me ? 'tuyo' : 'asignado';
}

function Card({ item, me }: { readonly item: SupportItem; readonly me: StaffMemberId }) {
  return (
    <li className={s.cardItem}>
      <div className={meta}>
        {item.urgent ? <span className={urgentBadge}>Urgente</span> : null}
        <span className={pill}>{KIND_LABELS[item.kind]}</span>
        <span>{owner(item, me)}</span>
      </div>
      <Link href={`/inbox/${item.id}` as Route} className={rowTitle}>
        {item.title}
      </Link>
      <div className={meta}>
        <time className={s.time} dateTime={item.createdAt}>
          {formatInstant(item.createdAt)}
        </time>
        {item.dueAt ? <span>responder antes del {formatDueDay(item.dueAt)}</span> : null}
      </div>
    </li>
  );
}

function Empty({ status, calm }: { readonly status: SupportStatus; readonly calm: boolean }) {
  if (!calm) return <p className={`${s.empty} ${s.emptyText}`}>{EMPTY[status]}</p>;
  return (
    <div className={s.empty}>
      <DonPortrait mood="tranquilo" large />
      <p className={s.emptyTitle}>Inbox en cero.</p>
      <p className={s.emptyText}>
        Don Cuentas se fue por unos tacos. Cuando entre algo, aquí lo ves primero.
      </p>
    </div>
  );
}

function Column(props: {
  readonly status: SupportStatus;
  readonly result: ListResult;
  readonly view: InboxView;
  readonly me: StaffMemberId;
  readonly calm: boolean;
}) {
  const { status, result } = props;
  const n = `${result.items.length}${result.nextCursor ? '+' : ''}`;
  return (
    <section className={s.column} aria-labelledby={`col-${status}`}>
      <div className={s.columnHead}>
        <span className={led[LED[status]]} aria-hidden="true" />
        <h2 id={`col-${status}`} className={s.columnTitle}>
          {STATUS_LABELS[status]}
        </h2>
        <span className={s.count}>{n}</span>
      </div>
      {result.items.length === 0 ? (
        <Empty status={status} calm={props.calm && status === 'nuevo'} />
      ) : (
        <ul className={s.cards} aria-label={STATUS_LABELS[status]}>
          {result.items.map((item) => (
            <Card key={item.id} item={item} me={props.me} />
          ))}
        </ul>
      )}
      {result.nextCursor ? (
        <Link className={s.more} href={inboxHref(props.view, { estado: status }) as Route}>
          Ver todos
        </Link>
      ) : null}
    </section>
  );
}

/** Nuevo · En curso · Resuelto, side by side; each column links to its full list. */
export function Board(props: {
  readonly columns: BoardColumns;
  readonly view: InboxView;
  readonly me: StaffMemberId;
}) {
  const calm = SUPPORT_STATUSES.every(
    (st) => st === 'resuelto' || props.columns[st].items.length === 0,
  );
  return (
    <div className={s.board}>
      {SUPPORT_STATUSES.map((status) => (
        <Column
          key={status}
          status={status}
          result={props.columns[status]}
          view={props.view}
          me={props.me}
          calm={calm}
        />
      ))}
    </div>
  );
}
