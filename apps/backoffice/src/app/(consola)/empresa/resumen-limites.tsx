import { Cajon } from '@/components/cajon';
import type { LimitesVista, MedidorVista } from '@/server/empresa/limites-view';
import * as c from '@/styles/mostrador-limites.css';

import { LimitesForm } from './limites-form';

/**
 * «Límites del año» (E-15, board CD-12d): the Resumen's drawer. The SAS and
 * RESICO gauges with their 60/80/95 lines and the projection, where the
 * figures come from, and the caps per year; a year without its caps asks for
 * them instead of measuring against last year's.
 */
const LINEAS = [60, 80, 95] as const;

function Pista({ m }: { readonly m: MedidorVista }) {
  const ancho = (v: number) => (v > 0 ? Math.max(v, 0.6) : 0);
  return (
    <svg className={c.pista} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
      <rect className={c.marca.proyeccion} x={0} y={0} width={ancho(m.proyectado)} height={10} />
      <rect className={c.marca.avance} x={0} y={0} width={ancho(m.avance)} height={10} />
      {LINEAS.map((l) => (
        <rect key={l} className={c.marca.linea} x={l - 0.2} y={0} width={0.4} height={10} />
      ))}
    </svg>
  );
}

function Medidor({ m }: { readonly m: MedidorVista }) {
  return (
    <section className={c.medidor} aria-label={m.nombre} data-testid={`limite-${m.id}`}>
      <div className={c.medidorCabeza}>
        <div>
          <h3 className={c.subtitulo}>{m.nombre}</h3>
          <p className={c.nota}>{m.monto}</p>
        </div>
        <span className={c.pct}>{m.pct}</span>
      </div>
      <Pista m={m} />
      <div className={c.escala} aria-hidden="true">
        <span>0 %</span>
        <span className={c.marcaEscala}>60 %</span>
        <span className={c.marcaEscala}>80 %</span>
        <span className={c.marcaEscala}>95 %</span>
      </div>
      <div className={c.leyenda}>
        <span className={c.leyendaItem}>
          <span className={c.muestra.avance} />
          Ingresos del año
        </span>
        <span className={c.leyendaItem}>
          <span className={c.muestra.proyeccion} />
          {m.proyTexto}
        </span>
      </div>
      {m.alerta === null ? null : (
        <div className={`${c.alertaBase} ${c.alerta[m.alerta.tono]}`} role="note">
          <span className={c.alertaTitulo}>{m.alerta.titulo}</span>
          <span>{m.alerta.texto}</span>
        </div>
      )}
      <p className={c.nota}>{m.queEs}</p>
    </section>
  );
}

function Fuentes({ v }: { readonly v: LimitesVista }) {
  return (
    <section aria-labelledby="como">
      <h3 id="como" className={c.subtitulo}>
        De dónde salen las cifras
      </h3>
      {v.fuentes.map((f) => (
        <div key={f.que} className={c.fila} data-testid="limite-fuente">
          <span>{f.que}</span>
          <strong>{f.cuanto}</strong>
        </div>
      ))}
    </section>
  );
}

function Topes({ v }: { readonly v: LimitesVista }) {
  return (
    <section aria-labelledby="topes">
      <h3 id="topes" className={c.subtitulo}>
        Topes por año
      </h3>
      {v.topes.map((t) => (
        <div key={t.anio} className={c.filaTopes} data-testid={`tope-${t.anio}`}>
          <strong>{t.anio}</strong>
          <span className={t.falta ? c.falta : undefined}>SAS {t.sas}</span>
          <span className={t.falta ? c.falta : undefined}>RESICO persona moral {t.resico}</span>
        </div>
      ))}
    </section>
  );
}

export function Limites({ v, cerrar }: { readonly v: LimitesVista; readonly cerrar: string }) {
  return (
    <Cajon eyebrow="Límites del año" titulo={v.titulo} sub={v.subtitulo} cerrar={cerrar}>
      {v.conTope ? (
        <>
          {v.medidores.map((m) => (
            <Medidor key={m.id} m={m} />
          ))}
          <Fuentes v={v} />
        </>
      ) : (
        <LimitesForm anio={v.anio} anterior={v.anterior} />
      )}
      <Topes v={v} />
    </Cajon>
  );
}
