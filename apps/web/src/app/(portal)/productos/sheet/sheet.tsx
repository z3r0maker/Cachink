'use client';

import { Button, Drawer } from '@/components';

import type { Producto } from '../parts';
import { Apariencia } from './apariencia';
import { Basico, Inventario, Precio, Uso } from './sections';
import { useProductoForm } from './use-producto-form';

/**
 * The product sheet (P-07): «Editar» in a drawer, five sections. «Nuevo
 * producto» has its own page since ADR-107 (`/productos/nuevo`). A new product reaches every phone at zero stock (ADR-081); an edit
 * reaches them as a logged update, with cost and stock tracking read-only.
 */
function ProductoSheet(props: {
  readonly editing: Producto | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const f = useProductoForm(props.editing, () => props.onOpenChange(false));
  const section = { draft: f.draft, set: f.set, editing: f.editing };
  return (
    <Drawer
      open={props.open}
      onOpenChange={props.onOpenChange}
      eyebrow="Tu catálogo"
      heading={f.editing ? `Editar ${props.editing?.nombre ?? ''}` : 'Nuevo producto'}
      description="Llega a todos los teléfonos en su siguiente sincronización."
      actions={
        <>
          {f.error === null ? null : (
            <span role="alert" data-testid="producto-error">
              {f.error}
            </span>
          )}
          <Button variant="primary" onClick={f.save} disabled={f.pending}>
            {f.pending ? 'Guardando…' : f.editing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <Basico {...section} />
      <Uso {...section} />
      <Precio {...section} />
      <Inventario {...section} />
      <Apariencia {...section} />
    </Drawer>
  );
}

export function EditarProductoSheet(props: {
  readonly producto: Producto | null;
  readonly onClose: () => void;
}) {
  return (
    <ProductoSheet
      editing={props.producto}
      open={props.producto !== null}
      onOpenChange={(open) => (open ? undefined : props.onClose())}
    />
  );
}
