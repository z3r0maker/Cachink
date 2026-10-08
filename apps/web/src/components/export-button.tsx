'use client';

import { useCallback, useState, type ReactNode } from 'react';

import { srOnly } from '../styles/global.css';
import { Button } from './button';
import { MonedaGirando } from './don/cargando';
import { ExportAviso } from './export-aviso';
import { formato as formatoClase } from './export-aviso.css';

/**
 * Downloads a dataset as .xlsx, and says so while it does (DS-02).
 *
 * A large business's export takes a while to build, and a plain link showed
 * nothing until the browser's download bar appeared — so people clicked
 * again, and each click is another whole-history read against a limit of five
 * every ten minutes. The button now fetches the file itself: «Preparando tu
 * archivo…» with a spinner and disabled until the file is in hand, then the
 * download; on failure a toast, never a saved error page.
 *
 * Open to every role including the contador, per `canExport()`.
 */
type Dataset = 'ventas' | 'gastos' | 'productos' | 'movimientos' | 'empleados';

const FALLO = 'No pudimos generar el archivo. Intenta de nuevo.';
const LIMITE = 'Espera unos minutos: hiciste varias exportaciones seguidas.';

/** `attachment; filename="x.xlsx"` → `x.xlsx`. */
const nombreDe = (disposition: string | null, dataset: Dataset) =>
  /filename="([^"]+)"/.exec(disposition ?? '')?.[1] ?? `xangarro-${dataset}.xlsx`;

function guardar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  // After the click has handed the blob to the download.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** One export: `null` when saved (or on the way to sign-in), the notice to show otherwise. */
async function descargar(dataset: Dataset): Promise<string | null> {
  try {
    const res = await fetch(`/api/export/${dataset}`, { cache: 'no-store' });
    if (res.status === 401) {
      // The session died: reloading lets the page's own gate send them to sign in.
      window.location.reload();
      return null;
    }
    if (res.status === 429) return LIMITE;
    if (!res.ok) return FALLO;
    // A stream that breaks halfway rejects here: no half file is saved.
    guardar(await res.blob(), nombreDe(res.headers.get('Content-Disposition'), dataset));
    return null;
  } catch {
    return FALLO;
  }
}

/**
 * One export's state, for a screen with two ways into the same file —
 * Productos › Movimientos' header button and its «Exportar todos» (DS-04):
 * both wait on the one request, and the toast shows once.
 */
export function useExportar(dataset: Dataset) {
  const [preparando, setPreparando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const cerrar = useCallback(() => setAviso(null), []);
  const exportar = async () => {
    if (preparando) return;
    setAviso(null);
    setPreparando(true);
    setAviso(await descargar(dataset));
    setPreparando(false);
  };
  return {
    dataset,
    preparando,
    exportar: () => void exportar(),
    aviso: aviso === null ? null : <ExportAviso texto={aviso} onClose={cerrar} />,
  };
}

export type Exportacion = ReturnType<typeof useExportar>;

export function ExportButton({
  dataset,
  label = 'Exportar',
  formato,
  control,
}: {
  readonly dataset: Dataset;
  readonly label?: string;
  /** A format tag after the label, e.g. «XLSX» (EsExportar). */
  readonly formato?: string;
  /** A shared export (`useExportar`); the button owns one otherwise. */
  readonly control?: Exportacion;
}) {
  const propia = useExportar(dataset);
  const e = control ?? propia;
  const etiqueta: ReactNode = e.preparando ? 'Preparando tu archivo…' : label;
  return (
    <>
      <Button
        variant="secondary"
        onClick={e.exportar}
        disabled={e.preparando}
        aria-busy={e.preparando}
        icon={e.preparando ? <MonedaGirando /> : undefined}
        data-testid={`export-${dataset}`}
      >
        {etiqueta}
        {formato === undefined || e.preparando ? null : (
          <span className={formatoClase}>{formato}</span>
        )}
      </Button>
      <span className={srOnly} aria-live="polite">
        {e.preparando ? 'Preparando tu archivo…' : ''}
      </span>
      {e.aviso}
    </>
  );
}
