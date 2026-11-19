import { randomUUID } from 'node:crypto';

import { formatMoney } from '@xangarro/domain';
import type { PlantillaRecurrente, Servicio } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Cajon } from '@/components/cajon';
import { hoyEnMexico } from '@/server/db/corp';
import {
  gastosDe,
  graficaDelServicio,
  kpisDe,
  notaGrafica,
  subtituloDe,
} from '@/server/empresa/servicio-detalle-view';
import { panelRecurrente } from '@/server/empresa/servicio-recurrente-view';
import { valoresDe } from '@/server/empresa/servicio-valores';
import { leerServicios } from '@/server/empresa/servicios-lectura';
import { cobroTexto, hrefServicio } from '@/server/empresa/servicios-textos';
import { mediosDePago } from '@/server/empresa/servicios-view';
import { requireFounderPage } from '@/server/founder';
import * as s from '@/styles/mostrador-servicios.css';
import * as m from '@/styles/mostrador.css';

import { ServicioForm } from '../form';
import { DarDeBaja } from './dar-de-baja';
import { CostoDeCadaMes, Gastos, Kpis, SuRecurrente } from './paneles';

export const dynamic = 'force-dynamic';

function Encabezado({ servicio }: { readonly servicio: Servicio }) {
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <Link className={m.boton.quieto} href={'/empresa/servicios' as Route}>
          ‹ Servicios
        </Link>
        <h1 className={m.title}>{servicio.nombre}</h1>
        <p className={m.sub}>{subtituloDe(servicio, cobroTexto(servicio))}</p>
      </div>
      <div className={m.row}>
        {servicio.estado === 'baja' ? (
          <span className={`${m.tagBase} ${m.tag.off}`}>De baja</span>
        ) : (
          <DarDeBaja servicioId={servicio.id} nombre={servicio.nombre} />
        )}
        <Link
          className={m.boton.primario}
          href={`${hrefServicio(servicio.id)}?editar=1` as Route}
          scroll={false}
        >
          Editar
        </Link>
      </div>
    </header>
  );
}

function Editor(props: {
  readonly servicio: Servicio;
  readonly plantilla: PlantillaRecurrente | null;
  readonly medios: readonly string[];
}) {
  const href = hrefServicio(props.servicio.id);
  return (
    <Cajon eyebrow="Servicios" titulo={`Editar ${props.servicio.nombre}`} cerrar={href}>
      <ServicioForm
        v={valoresDe(props.servicio)}
        recurrente={props.plantilla?.activo ?? props.servicio.plantillaId === null}
        plantillaNuevaId={randomUUID()}
        mediosConocidos={props.medios}
        cerrar={href}
      />
    </Cajon>
  );
}

/**
 * A service (E-24, board CD-18c): its average and its month, each month's
 * cost against its alert, the charges it posted and its recurring template.
 * «Editar» opens the drawer of board CD-18d filled in.
 */
export default async function ServicioPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  await requireFounderPage();
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const hoy = hoyEnMexico();
  const datos = await leerServicios(hoy);
  const servicio = datos.servicios.find((x) => x.id === decodeURIComponent(id));
  if (servicio === undefined) notFound();
  const plantilla = datos.plantillas.find((p) => p.id === servicio.plantillaId) ?? null;
  const grafica = graficaDelServicio(servicio, datos);
  const kpis = kpisDe(servicio, datos);
  return (
    <div className={m.page}>
      <Encabezado servicio={servicio} />
      <Kpis kpis={kpis} />
      {grafica === null ? null : (
        <CostoDeCadaMes
          grafica={grafica}
          categoria={servicio.categoria}
          aviso={servicio.aviso === null ? null : formatMoney(servicio.aviso)}
          nota={notaGrafica(servicio, hoy)}
          pasa={servicio.cobro === 'uso' && kpis.some((k) => k.aviso)}
        />
      )}
      <div className={s.columnas}>
        <Gastos gastos={gastosDe(servicio, datos)} comision={servicio.cobro === 'comision'} />
        <SuRecurrente p={panelRecurrente(servicio, plantilla, hoy)} />
      </div>
      {sp.editar === '1' ? (
        <Editor
          servicio={servicio}
          plantilla={plantilla}
          medios={mediosDePago(datos).map((x) => x.nombre)}
        />
      ) : null}
    </div>
  );
}
