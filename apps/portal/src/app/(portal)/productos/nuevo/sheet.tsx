'use client';

import { useState } from 'react';

import { Button, Drawer } from '@/components';

import { Apariencia } from './apariencia';
import { Basico, Inventario, Precio, Uso } from './sections';
import { useNuevoProducto } from './use-nuevo-producto';

/**
 * «Nuevo producto» (P-07, ADR-080). The product reaches every phone on its
 * next pull, at zero stock (ADR-081).
 */
export function NuevoProductoSheet() {
  const [open, setOpen] = useState(false);
  const f = useNuevoProducto(() => setOpen(false));
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Nuevo producto
      </Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        heading="Nuevo producto"
        description="Llega a todos los teléfonos en su siguiente sincronización."
        actions={
          <>
            {f.error === null ? null : (
              <span role="alert" data-testid="nuevo-error">
                {f.error}
              </span>
            )}
            <Button variant="primary" onClick={f.save} disabled={f.pending}>
              {f.pending ? 'Guardando…' : 'Crear producto'}
            </Button>
          </>
        }
      >
        <Basico draft={f.draft} set={f.set} />
        <Uso draft={f.draft} set={f.set} />
        <Precio draft={f.draft} set={f.set} />
        <Inventario draft={f.draft} set={f.set} />
        <Apariencia draft={f.draft} set={f.set} />
      </Drawer>
    </>
  );
}
