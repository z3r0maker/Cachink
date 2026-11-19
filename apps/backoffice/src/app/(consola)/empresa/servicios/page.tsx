import { randomUUID } from 'node:crypto';

import type { Route } from 'next';
import Link from 'next/link';

import { Cajon } from '@/components/cajon';
import { hoyEnMexico } from '@/server/db/corp';
import { nombreMes } from '@/server/empresa/fechas';
import { valoresNuevos } from '@/server/empresa/servicio-valores';
import { leerServicios } from '@/server/empresa/servicios-lectura';
import { tarjetasUso } from '@/server/empresa/servicios-uso-view';
import {
  filasServicios,
  mediosDePago,
  parseVer,
  tilesServicios,
  type Tile,
} from '@/server/empresa/servicios-view';
import { requireFounderPage } from '@/server/founder';
import * as r from '@/styles/mostrador-resultados.css';
import * as s from '@/styles/mostrador-servicios.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { ServicioForm } from './form';
import { TablaServicios } from './tabla';
import { PorUso } from './uso';

export const dynamic = 'force-dynamic';

function Tiles({ tiles }: { readonly tiles: readonly Tile[] }) {
  return (
    <section className={m.tiles} aria-label="Resumen de servicios">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`${m.panelPad} ${t.aviso ? s.tileAviso : ''}`}
          data-testid="servicios-tile"
        >
          <span className={m.tileLabel}>{t.label}</span>
          <span className={m.tileValue}>{t.valor}</span>
          <span className={m.tileNote}>{t.nota}</span>
        </div>
      ))}
    </section>
  );
}

function Medios({ medios }: { readonly medios: ReturnType<typeof mediosDePago> }) {
  if (medios.length === 0) return null;
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="medios">
      <h2 id="medios" className={r.titular}>
        Tarjetas y cuentas de pago
      </h2>
      <div className={s.medios}>
        {medios.map((x) => (
          <div key={x.nombre} className={s.medio}>
            <span className={s.nombre}>{x.nombre}</span>
            <span className={s.para}>{x.cuantos}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Dinero › Servicios (E-24, board CD-18): which services MEXIA pays for and
 * what they will cost. «+ Nuevo servicio» opens the drawer of board CD-18d.
 */
export default async function ServiciosPage(props: {
  searchParams: Promise<{ ver?: string; nuevo?: string }>;
}) {
  await requireFounderPage();
  const sp = await props.searchParams;
  const hoy = hoyEnMexico();
  const datos = await leerServicios(hoy);
  const ver = parseVer(sp.ver);
  const total = datos.servicios.filter((x) => x.estado !== 'baja').length;
  return (
    <div className={m.page}>
      <EncabezadoSeccion actual="/empresa/servicios">
        <Link
          className={m.boton.primario}
          href={'/empresa/servicios?nuevo=1' as Route}
          scroll={false}
        >
          + Nuevo servicio
        </Link>
      </EncabezadoSeccion>
      <Tiles tiles={tilesServicios(datos)} />
      <PorUso tarjetas={tarjetasUso(datos)} mes={nombreMes(hoy.slice(0, 7))} />
      <TablaServicios filas={filasServicios(datos, ver)} total={total} ver={ver} />
      <Medios medios={mediosDePago(datos)} />
      {sp.nuevo === '1' ? (
        <Cajon eyebrow="Servicios" titulo="Nuevo servicio" cerrar="/empresa/servicios">
          <ServicioForm
            v={valoresNuevos(randomUUID())}
            recurrente
            plantillaNuevaId={randomUUID()}
            mediosConocidos={mediosDePago(datos).map((x) => x.nombre)}
            cerrar="/empresa/servicios"
          />
        </Cajon>
      ) : null}
    </div>
  );
}
