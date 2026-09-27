'use client';

import { Banner, Button, Drawer } from '@/components';

import { AtributosEdit } from './atributos';
import type { Business } from './draft';
import { FiscalesEdit } from './fiscales';
import { GeneralesEdit } from './generales';
import type { Edicion, Seccion } from './use-edicion';

const TITULO: Readonly<Record<Seccion, string>> = {
  generales: 'Datos generales',
  fiscales: 'Datos fiscales',
  atributos: 'Atributos de producto',
};

/**
 * The edit drawer (CfgNegocio): one section at a time, «Cancelar» throws the
 * draft away, «Guardar cambios» sends the whole business as one patch.
 */
export function EdicionDrawer({
  e,
  business,
}: {
  readonly e: Edicion;
  readonly business: Business;
}) {
  const abierto = e.draft !== null && e.seccion !== null;
  return (
    <Drawer
      open={abierto}
      onOpenChange={(o) => (o ? undefined : e.cancel())}
      eyebrow="EDITAR"
      heading={e.seccion === null ? 'Tu negocio' : TITULO[e.seccion]}
      width={560}
      actions={
        <>
          <Button variant="secondary" onClick={e.cancel} disabled={e.pending}>
            Cancelar
          </Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={e.save} disabled={e.pending}>
            {e.pending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      {e.note !== null ? <Banner tone="critical" title={e.note} /> : null}
      {e.seccion === 'generales' ? <GeneralesEdit e={e} business={business} /> : null}
      {e.seccion === 'fiscales' ? <FiscalesEdit e={e} /> : null}
      {e.seccion === 'atributos' ? <AtributosEdit e={e} /> : null}
    </Drawer>
  );
}
