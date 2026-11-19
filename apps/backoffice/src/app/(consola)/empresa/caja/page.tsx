import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { graficaDe, parseEscenario } from '@/server/empresa/caja-grafica';
import { leerCaja } from '@/server/empresa/caja-lectura';
import { avisoDe, tilesDe } from '@/server/empresa/caja-view';
import { fechaLarga } from '@/server/empresa/fechas';
import { autonomiaDeHoy } from '@/server/empresa/resumen-hero';
import { requireFounderPage } from '@/server/founder';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Grafica } from './grafica';
import { Paneles } from './paneles';
import { Tiles } from './tiles';

export const dynamic = 'force-dynamic';

function SinMovimientos() {
  return (
    <section className={`${m.hero} ${i.cabeza}`} aria-labelledby="caja-vacia">
      <div>
        <span className={m.eyebrow}>Caja</span>
        <h2 id="caja-vacia" className={i.total}>
          Aún no hay dinero registrado
        </h2>
        <p className={i.muted}>
          La caja sale de los movimientos: el capital de los socios, los cobros y lo que se paga.
          Con el primero aparecen aquí la caja, el gasto al mes y cuántos meses alcanza.
        </p>
      </div>
      <Link className={m.boton.primario} href={'/empresa/movimientos/registrar' as Route}>
        Registrar un movimiento
      </Link>
    </section>
  );
}

/**
 * Caja (E-23, board CD-15c), Dinero's fourth tab: cash today and where it
 * sits, the monthly spending and how long it lasts, cash at each month's close
 * with its projection under the Resumen's three scenarios (`?escenario=`), and
 * last month's flow, the partners' money and the next 30 days of payments.
 */
export default async function CajaPage(props: { searchParams: Promise<{ escenario?: string }> }) {
  await requireFounderPage();
  const sp = await props.searchParams;
  const hoy = hoyEnMexico();
  const d = await leerCaja(hoy);
  const a = autonomiaDeHoy(d.movs, hoy);
  const vacio = !d.movs.some((x) => x.fecha <= hoy);
  const escenario = parseEscenario(sp.escenario);
  const aviso = avisoDe(d, a);
  return (
    <div className={m.page}>
      <EncabezadoSeccion
        actual="/empresa/caja"
        sub={`Al ${fechaLarga(hoy)} de ${hoy.slice(0, 4)} · con lo registrado hasta hoy`}
      />
      {vacio ? (
        <SinMovimientos />
      ) : (
        <>
          {aviso === null ? null : (
            <div className={i.aviso} role="status" data-testid="caja-aviso">
              <span>
                <span className={i.pasoTitulo}>La caja está debajo de la reserva mínima</span>
                <span className={i.muted}>{aviso.texto}</span>
              </span>
              <Link className={m.boton.primario} href={'/empresa/socios' as Route}>
                {aviso.enlace}
              </Link>
            </div>
          )}
          <Tiles tiles={tilesDe(d, a)} />
          <Grafica g={graficaDe(d.movs, a, escenario, hoy)} escenario={escenario} />
          <Paneles d={d} a={a} />
        </>
      )}
    </div>
  );
}
