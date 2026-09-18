import type { ReactNode } from 'react';

import { srOnly } from '../styles/global.css';
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
}: DataTableProps<Row>) {
  return (
    <div className={tableCard}>
      {/* A scrollable region needs keyboard access, so it takes focus itself. */}
      <div className={scroller} tabIndex={0} role="region" aria-label={caption}>
        <table className={table} style={{ minWidth }}>
          <caption className={srOnly}>{caption}</caption>
          <thead>
            <HeaderRow columns={columns} />
          </thead>
          <tbody>
            {rows.map((row) => (
              <BodyRow
                key={rowKey(row)}
                row={row}
                columns={columns}
                rowKey={rowKey}
                onRowClick={onRowClick}
                selectedKey={selectedKey}
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
