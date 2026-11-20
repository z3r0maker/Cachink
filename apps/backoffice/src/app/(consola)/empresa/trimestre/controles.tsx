'use client';

import * as m from '@/styles/mostrador.css';

/**
 * «Exportar PDF» (E-17, owner decision 2026-11-20): the browser's print
 * dialog over a print layout, where «Guardar como PDF» gives the file. The
 * PDF is the page itself, so the two never disagree.
 */
export function ExportarPdf() {
  return (
    <button
      type="button"
      className={m.boton.secundario}
      onClick={() => window.print()}
      data-no-imprimir
    >
      Exportar PDF
    </button>
  );
}
