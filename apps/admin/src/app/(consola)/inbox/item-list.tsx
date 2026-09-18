import Link from 'next/link';
import type { Route } from 'next';
import type { StaffMemberId, SupportItem } from '@xangarro/domain';

import { formatInstant, KIND_LABELS, STATUS_LABELS } from '@/server/inbox/labels';
import { muted } from '@/styles/ui.css';

import { list, meta, pill, row, rowTitle, urgentBadge } from './inbox.css';

function owner(item: SupportItem, me: StaffMemberId): string {
  if (item.ownerStaffId === null) return 'Sin asignar';
  return item.ownerStaffId === me ? 'Tuyo' : 'Asignado';
}

function Row({ item, me }: { readonly item: SupportItem; readonly me: StaffMemberId }) {
  return (
    <li className={row}>
      <div>
        <Link href={`/inbox/${item.id}` as Route} className={rowTitle}>
          {item.title}
        </Link>
        <div className={meta}>
          {item.urgent ? <span className={urgentBadge}>Urgente</span> : null}
          <span className={pill}>{KIND_LABELS[item.kind]}</span>
          <span className={pill}>{STATUS_LABELS[item.status]}</span>
          <span>{owner(item, me)}</span>
          {item.paymentRef ? <span>Pago {item.paymentRef}</span> : null}
        </div>
      </div>
      <time className={muted} dateTime={item.createdAt}>
        {formatInstant(item.createdAt)}
      </time>
    </li>
  );
}

export function ItemList(props: {
  readonly items: readonly SupportItem[];
  readonly me: StaffMemberId;
}) {
  if (props.items.length === 0) {
    return <p className={muted}>No hay items con estos filtros.</p>;
  }
  return (
    <ul className={list} aria-label="Items del inbox">
      {props.items.map((item) => (
        <Row key={item.id} item={item} me={props.me} />
      ))}
    </ul>
  );
}
