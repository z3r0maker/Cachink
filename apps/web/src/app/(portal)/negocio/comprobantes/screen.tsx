'use client';

import { Button } from '@/components';

import { MiNegocioHead } from '../hub';
import { LogoBloque } from './brand-widgets';
import { ColorBloque } from './color';
import { Campos } from './campos';
import * as c from './comprobantes.css';
import { PlantillaBloque } from './plantillas';
import { useComprobantes, type Comprobantes, type ComprobantesView } from './use-comprobantes';
import { VistaPrevia } from './vista-previa';

export type { ComprobantesView } from './use-comprobantes';

/**
 * Mi negocio · Comprobantes (N-19/N-20, CfgComprobantes): logo, template,
 * colour and the receipt fields on the left; the live preview on the right;
 * one save bar for all of it. Tickets travel by WhatsApp: nothing prints.
 */
const SUCIA = 'Tienes cambios sin guardar. La vista previa ya los muestra.';

/** What the bar says: an error first, then the last thing saved, then the draft's state. */
function barra(k: Comprobantes): { estado: 'mal' | 'sucia' | 'limpia'; texto: string } {
  if (k.aviso?.tono === 'mal') return { estado: 'mal', texto: k.aviso.texto };
  const estado = k.sucia ? 'sucia' : 'limpia';
  // The logo saves on its own; its colour may still wait for «Guardar cambios».
  if (k.aviso !== null)
    return {
      estado,
      texto: k.sucia ? `${k.aviso.texto} Te falta guardar el resto.` : k.aviso.texto,
    };
  return { estado, texto: k.sucia ? SUCIA : 'Todo guardado. Así salen hoy tus comprobantes.' };
}

function BarraGuardar({ k }: { readonly k: Comprobantes }) {
  const { estado, texto } = barra(k);
  return (
    <div className={c.bar[estado]} role="region" aria-label="Guardar cambios de comprobantes">
      <span className={c.punto[estado]} aria-hidden="true" />
      <span className={c.barTexto} role={estado === 'mal' ? 'alert' : 'status'}>
        {texto}
      </span>
      <span className={c.barBotones}>
        <Button variant="secondary" disabled={!k.sucia || k.pending} onClick={k.descartar}>
          Descartar
        </Button>
        <Button variant="primary" disabled={!k.sucia || k.pending} onClick={k.guardar}>
          {k.pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </span>
    </div>
  );
}

function Controles({ k, view }: { readonly k: Comprobantes; readonly view: ComprobantesView }) {
  const off = !view.mayWrite;
  return (
    <section className={c.controles} aria-label="Cómo se ve tu comprobante">
      <LogoBloque
        logoUrl={k.logoUrl}
        iniciales={view.iniciales}
        mayWrite={view.mayWrite}
        subiendo={k.subiendo}
        onFile={k.subir}
      />
      <PlantillaBloque
        valor={k.form.receiptTemplate}
        color={k.form.brandColor}
        onPick={(t) => k.set('receiptTemplate', t)}
      />
      <ColorBloque
        valor={k.form.brandColor}
        hex={k.hex}
        plantilla={k.form.receiptTemplate}
        disabled={off}
        onHex={k.color}
      />
      <Campos k={k} disabled={off} />
      {off ? (
        <p className={c.nota}>Solo el dueño o un administrador cambia tus comprobantes.</p>
      ) : null}
    </section>
  );
}

export function ComprobantesScreen(view: ComprobantesView) {
  const k = useComprobantes(view);
  const marca = {
    nombre: view.nombre,
    iniciales: view.iniciales,
    logoUrl: k.logoUrl,
    form: k.form,
  };
  return (
    <div className={c.pila}>
      <MiNegocioHead activo="comprobantes" />
      <div className={c.rejilla}>
        <Controles k={k} view={view} />
        <VistaPrevia m={marca} version={k.version} sucia={k.sucia} />
      </div>
      {view.mayWrite ? <BarraGuardar k={k} /> : null}
    </div>
  );
}
