'use client';

import { Icon } from '@/shell/icon';

import type { Marca, Plantilla } from './muestra';
import { PapelPreview } from './papel';
import { TicketPreview } from './ticket';
import * as v from './vista.css';

const NOMBRE: Readonly<Record<Plantilla, string>> = {
  ticket: 'Ticket · así llega por WhatsApp',
  clasico: 'Clásico',
  moderno: 'Moderno',
  minimal: 'Minimal',
};

const DESCARGA = 'M12 15V3M7 10l5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4';

function Descargas(props: {
  readonly t: Plantilla;
  readonly version: number;
  readonly sucia: boolean;
}) {
  const base = `/api/comprobantes/muestra?plantilla=${props.t}`;
  return (
    <div className={v.descargas}>
      {(['png', 'pdf'] as const).map((f) => (
        <a
          key={f}
          className={v.descarga}
          href={`${base}&formato=${f}&v=${props.version}`}
          download
          data-testid={`comprobante-descarga-${f}`}
        >
          <Icon path={DESCARGA} size={17} />
          Descargar {f.toUpperCase()}
        </a>
      ))}
      <span className={v.descargaNota}>
        {props.sucia
          ? 'Las descargas salen con tus datos guardados.'
          : 'Así lo reciben tus clientes por WhatsApp.'}
      </span>
    </div>
  );
}

/**
 * «Así se ve» (N-20, CfgComprobantes): the unsaved form, live. The downloads
 * are the real files from the server renderer, with what is saved.
 */
export function VistaPrevia(props: {
  readonly m: Marca;
  readonly version: number;
  readonly sucia: boolean;
}) {
  const t = props.m.form.receiptTemplate;
  return (
    <aside className={v.columna} aria-labelledby="comprobante-previa-t">
      <div className={v.mesa} data-testid="comprobante-vista-previa">
        <div className={v.mesaCabeza}>
          <h2 id="comprobante-previa-t" className={v.titulo}>
            ASÍ SE VE
          </h2>
          <span className={v.vivo}>
            <span className={v.vivoPunto} aria-hidden="true" />
            En vivo
          </span>
          <span className={v.plantillaNombre}>{NOMBRE[t]}</span>
        </div>
        {t === 'ticket' ? <TicketPreview m={props.m} /> : <PapelPreview m={props.m} t={t} />}
      </div>
      <Descargas t={t} version={props.version} sucia={props.sucia} />
    </aside>
  );
}
