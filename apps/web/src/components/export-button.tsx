'use client';

import { Button } from './button';

/**
 * Downloads a dataset as .xlsx.
 *
 * A plain link, not a fetch: the browser already knows how to handle a
 * `Content-Disposition` response, and doing it by hand would mean holding the
 * whole file in memory, building a Blob URL and revoking it — more code, and
 * worse behaviour on a slow connection, where a link shows real progress and a
 * fetch shows nothing.
 *
 * Open to every role including the contador, per `canExport()`.
 */
export function ExportButton({
  dataset,
  label = 'Exportar',
}: {
  readonly dataset: 'ventas' | 'gastos' | 'productos' | 'movimientos' | 'empleados';
  readonly label?: string;
}) {
  return (
    <Button
      variant="secondary"
      onClick={() => {
        window.location.href = `/api/export/${dataset}`;
      }}
      data-testid={`export-${dataset}`}
    >
      {label}
    </Button>
  );
}
