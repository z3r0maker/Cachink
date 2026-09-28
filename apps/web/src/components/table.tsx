import type { ReactNode } from 'react';

import { srOnly } from '../styles/global.css';
import { atenuado, avisoCelda, barra, pista } from './table-carga.css';
import {
  scroller,
  table,
  tableCard,
  tableFooter,
  td,
  tdNumeric,
  th,
  thNumeric,
  tr,
} from './table.css';

export interface ColumnDef<Row> {
  readonly key: string;
  readonly header: string;
  /** Right-aligned with tabular numerals — money and counts. */
  readonly numeric?: boolean;
  readonly render: (row: Row) => ReactNode;
}

export interface DataTableProps<Row> {
  readonly columns: readonly ColumnDef<Row>[];
  readonly rows: readonly Row[];
  readonly rowKey: (row: Row) => string;
  readonly onRowClick?: (row: Row) => void;
  readonly selectedKey?: string;
  /** Minimum width before the table scrolls inside its card, never the page. */
  readonly minWidth?: number;
  readonly footer?: ReactNode;
  /** Shown under the header row when `rows` is empty (an inset `EmptyState`). */
  readonly empty?: ReactNode;
  readonly caption: string;
  /**
   * Set by a table the server pages (DS-01): `true` while new rows are on the
   * way — a bar under the header, the old rows dimmed. Left out, no track.
   */
  readonly busy?: boolean;
  /** A full-width row under the header, above the rows — an error they stay under. */
  readonly aviso?: ReactNode;
}

/** The loading track and the notice row, both under the header. */
function Cabecera({
  span,
  busy,
  aviso,
}: {
  readonly span: number;
  readonly busy?: boolean;
  readonly aviso?: ReactNode;
}) {
  return (
    <>
      {busy === undefined ? null : (
        <tr aria-hidden="true">
          <td colSpan={span} className={pista} data-busy={busy}>
            {busy ? <span className={barra} /> : null}
          </td>
        </tr>
      )}
      {aviso ? (
        <tr>
          <td colSpan={span} className={avisoCelda}>
            {aviso}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function HeaderRow<Row>({ columns }: { readonly columns: readonly ColumnDef<Row>[] }) {
  return (
    <tr>
      {columns.map((c) => (
        <th key={c.key} scope="col" className={c.numeric ? `${th} ${thNumeric}` : th}>
          {c.header}
        </th>
      ))}
    </tr>
  );
}

function BodyRow<Row>({
  row,
  columns,
  rowKey,
  onRowClick,
  selectedKey,
}: {
  readonly row: Row;
  readonly columns: readonly ColumnDef<Row>[];
  readonly rowKey: (row: Row) => string;
  readonly onRowClick?: (row: Row) => void;
  readonly selectedKey?: string;
}) {
  const key = rowKey(row);
  return (
    <tr
      className={tr}
      data-selected={selectedKey === key ? 'true' : undefined}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
    >
      {columns.map((c) => (
        <td key={c.key} className={c.numeric ? `${td} ${tdNumeric}` : td}>
          {c.render(row)}
        </td>
      ))}
    </tr>
  );
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  minWidth = 960,
  footer,
  empty,
  caption,
  busy,
  aviso,
}: DataTableProps<Row>) {
  return (
    <div className={tableCard}>
      {/* A scrollable region needs keyboard access, so it takes focus itself. */}
      <div className={scroller} tabIndex={0} role="region" aria-label={caption}>
        <table className={table} style={{ minWidth }}>
          <caption className={srOnly}>{caption}</caption>
          <thead>
            <HeaderRow columns={columns} />
            <Cabecera span={columns.length} busy={busy} aviso={aviso} />
          </thead>
          <tbody className={atenuado} data-busy={busy === true}>
            {rows.map((row) => (
              <BodyRow
                key={rowKey(row)}
                row={row}
                {...{ columns, rowKey, onRowClick, selectedKey }}
              />
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? empty : null}
      {footer ? <div className={tableFooter}>{footer}</div> : null}
    </div>
  );
}
