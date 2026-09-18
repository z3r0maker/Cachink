import Link from 'next/link';
import type { Route } from 'next';

import { FLAG_COPY, MODE_LABELS } from '@/server/flags/labels';
import type { FlagRow } from '@/server/flags/overview';
import { formatDay } from '@/server/tenants/labels';

import { name, sub, table, tableWrap, td, th } from '../tenants/tenants.css';
import { actions, mode } from './flags.css';
import { editHref, historyHref } from './params';

const HEADERS = ['Clave', 'Estado actual', 'Predeterminado', 'Último cambio', ''] as const;

function StateCell({ row }: { readonly row: FlagRow }) {
  const { state } = row;
  return (
    <td className={td}>
      <span className={mode[state.mode]}>{MODE_LABELS[state.mode]}</span>
      <span className={sub}>
        {state.source === 'default'
          ? 'Sin cambios: rige el valor del código'
          : state.mode === 'allowlist'
            ? `${state.allowlistBusinessIds.length} negocios en la lista`
            : 'Fijado por staff'}
      </span>
    </td>
  );
}

function Row({ row }: { readonly row: FlagRow }) {
  const copy = FLAG_COPY[row.key];
  return (
    <tr>
      <td className={td}>
        <span className={name}>{copy.nombre}</span>
        <span className={sub}>
          {copy.tipo} · <code>{row.key}</code>
        </span>
        <span className={sub}>{copy.descripcion}</span>
      </td>
      <StateCell row={row} />
      <td className={td}>{row.defaultOn ? 'Encendido' : 'Apagado'}</td>
      <td className={td}>
        {row.lastChange === null ? (
          '—'
        ) : (
          <>
            {formatDay(row.lastChange.at)} · {row.lastChange.by}
            <span className={sub}>«{row.lastChange.reason}»</span>
          </>
        )}
      </td>
      <td className={td}>
        <span className={actions}>
          <Link href={editHref(row.key) as Route}>Editar</Link>
          <Link href={historyHref(row.key) as Route}>Historial</Link>
        </span>
      </td>
    </tr>
  );
}

/** Every platform key: current mode, code default, last change. */
export function FlagTable({ rows }: { readonly rows: readonly FlagRow[] }) {
  return (
    <div className={tableWrap}>
      <table className={table}>
        <thead>
          <tr>
            {HEADERS.map((h, i) => (
              <th key={i} className={th} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.key} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
