import type { Route } from 'next';
import Link from 'next/link';

import type { TarjetaUso } from '@/server/empresa/servicios-uso-view';
import * as r from '@/styles/mostrador-resultados.css';
import * as s from '@/styles/mostrador-servicios.css';
import * as m from '@/styles/mostrador.css';

import { Barras } from './barras';

/**
 * «Los que cobran por uso» (E-24, board CD-18): each one's six months, its
 * trend and its alert. Each card opens the service.
 */
function Tarjeta({ t }: { readonly t: TarjetaUso }) {
  return (
    <Link className={s.tarjeta} href={t.href as Route} data-testid="servicio-uso">
      <div className={s.tarjetaCabeza}>
        <span>
          <span className={s.nombre}>{t.nombre}</span>
          {t.para === '' ? null : <span className={s.para}>{t.para}</span>}
        </span>
        {t.tendencia === null ? null : (
          <span
            className={`${s.chipBase} ${t.tendencia.sube ? s.tendencia.sube : s.tendencia.neutra}`}
          >
            {t.tendencia.texto}
          </span>
        )}
      </div>
      <Barras barras={t.barras} categoria={t.categoria} />
      <span className={s.resumen}>{t.resumen}</span>
      <span className={t.pasa ? s.notaAviso : s.nota}>{t.nota}</span>
    </Link>
  );
}

export function PorUso(props: { readonly tarjetas: readonly TarjetaUso[]; readonly mes: string }) {
  if (props.tarjetas.length === 0) return null;
  return (
    <section className={`${m.panelPad} ${m.stack} ${s.destacado}`} aria-labelledby="uso">
      <div className={m.row}>
        <h2 id="uso" className={r.titular}>
          Los que cobran por uso
        </h2>
        <p className={m.sub}>Costo de los últimos 6 meses y lo que va de {props.mes}</p>
      </div>
      <div className={s.tarjetas}>
        {props.tarjetas.map((t) => (
          <Tarjeta key={t.id} t={t} />
        ))}
      </div>
      <p className={s.nota}>
        * El mes en tono claro es una proyección: lo gastado hasta el día de la lectura, llevado al
        mes completo. Aparece desde el día 3.
      </p>
    </section>
  );
}
