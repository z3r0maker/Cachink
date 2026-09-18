'use client';

import { useState } from 'react';

import { Button, Drawer } from '@/components';

import { Revision } from './revision';
import { useImportar, type Step } from './use-importar';

/**
 * «Importar desde Excel» (P-07): plantilla → revisión → importación. Imported
 * products start at zero stock (ADR-081).
 */
function Archivo({ onFile }: { readonly onFile: (f: File | null) => void }) {
  return (
    <>
      <p>
        Descarga la plantilla, llénala y súbela. Los productos empiezan en cero existencias; súmalas
        después con un movimiento.
      </p>
      <a href="/api/import/productos" download>
        Descargar plantilla
      </a>
      <input
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        aria-label="Archivo de productos"
        data-testid="import-archivo"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </>
  );
}

function Listo({ step }: { readonly step: Extract<Step, { name: 'listo' }> }) {
  const r = step.result;
  return (
    <p data-testid="import-listo">
      Listo: {r.nuevos} nuevos, {r.actualizados} actualizados, {r.sinCambios} sin cambios,{' '}
      {r.omitidos} con error. Llegan a los teléfonos en su siguiente sincronización.
    </p>
  );
}

function Acciones({ f }: { readonly f: ReturnType<typeof useImportar> }) {
  if (f.step.name === 'listo') return <Button onClick={f.reset}>Importar otro archivo</Button>;
  const step = f.step;
  const importing = step.name === 'revision';
  const n =
    step.name === 'revision'
      ? step.rows.filter((r) => r.kind === 'nuevo' || r.kind === 'actualizar').length
      : 0;
  return (
    <>
      {f.error === null ? null : <span role="alert">{f.error}</span>}
      <Button
        variant="primary"
        disabled={f.pending || (importing && n === 0)}
        onClick={importing ? f.importar : f.revisar}
      >
        {f.pending ? 'Procesando…' : importing ? `Importar ${n} productos` : 'Revisar archivo'}
      </Button>
    </>
  );
}

export function ImportarSheet() {
  const [open, setOpen] = useState(false);
  const f = useImportar();
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Importar desde Excel
      </Button>
      <Drawer
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) f.reset();
        }}
        heading="Importar productos"
        description="Sube la plantilla llena; revisa antes de importar."
        actions={<Acciones f={f} />}
      >
        {f.step.name === 'archivo' ? <Archivo onFile={f.setFile} /> : null}
        {f.step.name === 'revision' ? <Revision rows={f.step.rows} /> : null}
        {f.step.name === 'listo' ? <Listo step={f.step} /> : null}
      </Drawer>
    </>
  );
}
