'use client';

import { useCallback, useState } from 'react';
import { colors } from '@xangarro/tokens';

import { Toast } from '@/operador/ui/toast';

import { Button } from './button';
import { MonedaGirando } from './don/cargando';

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

interface Aviso {
  readonly title: string;
  readonly body: string;
}

const FALLO: Aviso = { title: 'No pudimos generar el archivo', body: 'Intenta de nuevo.' };
const LIMITE: Aviso = {
  title: 'Espera unos minutos',
  body: 'Hiciste varias exportaciones seguidas. Intenta de nuevo en unos minutos.',
};

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
async function descargar(dataset: Dataset): Promise<Aviso | null> {
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

export function ExportButton({
  dataset,
  label = 'Exportar',
}: {
  readonly dataset: Dataset;
  readonly label?: string;
}) {
  const [preparando, setPreparando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const cerrar = useCallback(() => setAviso(null), []);
  const exportar = async () => {
    setAviso(null);
    setPreparando(true);
    setAviso(await descargar(dataset));
    setPreparando(false);
  };
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => void exportar()}
        disabled={preparando}
        aria-busy={preparando}
        icon={preparando ? <MonedaGirando /> : undefined}
        data-testid={`export-${dataset}`}
      >
        {preparando ? 'Preparando tu archivo…' : label}
      </Button>
      {aviso === null ? null : (
        <Toast
          title={aviso.title}
          body={aviso.body}
          tint={colors.warningSoft}
          width={380}
          onClose={cerrar}
        />
      )}
    </>
  );
}
