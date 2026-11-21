import type { Route } from 'next';
import Link from 'next/link';

import type { EncabezadoCierre } from '@/server/empresa/cierre-encabezado';
import type { PasoVista } from '@/server/empresa/cierre-pasos';
import { nombreMes } from '@/server/empresa/fechas';
import * as k from '@/styles/mostrador-cierre.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as m from '@/styles/mostrador.css';

import { CerrarForm, SubirEstados } from './acciones';

function Check() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline className={mv.traza} pathLength={1} points="20 6 9 17 4 12" />
    </svg>
  );
}

function UnPaso({ mes, p }: { readonly mes: string; readonly p: PasoVista }) {
  const listo = p.estado !== 'pendiente';
  return (
    <li
      className={`${k.fila[listo ? 'hecho' : 'pendiente']} ${mv.entra}`}
      data-testid="paso-cierre"
      data-paso={p.id}
      data-estado={p.estado}
    >
      <span className={`${i.circuloBase} ${i.circulo[listo ? 'hecho' : 'pendiente']}`}>
        {listo ? <Check /> : p.n}
      </span>
      <span className={k.texto}>
        <span className={i.pasoTitulo}>{p.titulo}</span>
        <span className={listo ? i.pasoSub : k.nota}>
          {p.estado === 'no_aplica' ? `No aplica · ${p.detalle}` : p.detalle}
        </span>
      </span>
      <span className={k.fuente}>{p.fuente}</span>
      {p.accion === null ? null : (
        <Link
          className={p.accion.primaria ? m.boton.primario : m.boton.secundario}
          href={p.accion.href as Route}
        >
          {p.accion.texto}
        </Link>
      )}
      {p.subir ? <SubirEstados mes={mes} otra={listo} /> : null}
    </li>
  );
}

function Progreso({ enc, total }: { readonly enc: EncabezadoCierre; readonly total: number }) {
  return (
    <div className={m.stack}>
      <div className={k.progreso}>
        <span>{`${enc.hechos} de ${total} pasos`}</span>
        <span className={i.pasoSub}>{enc.cerrado ? 'Cerrado' : 'Se recalcula al entrar'}</span>
      </div>
      <div className={`${k.barra} ${mv.escalona}`} aria-hidden="true">
        {Array.from({ length: total }, (_, n) => (
          <span
            key={n}
            className={
              n >= enc.hechos
                ? k.tramo.vacio
                : `${k.tramo[enc.cerrado ? 'cerrado' : 'hecho']} ${mv.llena}`
            }
          />
        ))}
      </div>
    </div>
  );
}

function Pie({ mes, enc }: { readonly mes: string; readonly enc: EncabezadoCierre }) {
  return (
    <div className={k.pie}>
      {enc.cerrado ? (
        enc.reabrirHref === null ? null : (
          <Link className={m.boton.secundario} href={enc.reabrirHref as Route}>
            {`Pedir reabrir ${nombreMes(mes)}`}
          </Link>
        )
      ) : (
        <CerrarForm mes={mes} puede={enc.puedeCerrar} />
      )}
      {enc.paqueteHref === null ? null : (
        <Link className={m.boton.secundario} href={enc.paqueteHref as Route}>
          Paquete para el contador
        </Link>
      )}
      <span className={k.nota}>{enc.cierreTexto}</span>
    </div>
  );
}

/**
 * The month's chip: «Abierto» carries the live dot (it pulses three times and
 * rests), and «Cerrado» lands as a stamp only right after closing (ADR-161).
 */
function Chip({
  chip,
  sello,
}: {
  readonly chip: EncabezadoCierre['chip'];
  readonly sello: boolean;
}) {
  const tono = chip.tono === 'cerrado' ? k.chipCerrado : i.tono[chip.tono];
  const estampa = sello && chip.tono === 'cerrado' ? ` ${mv.sello}` : '';
  return (
    <span className={`${i.chipBase} ${tono}${estampa}`} data-testid="cierre-chip">
      {chip.tono === 'off' ? <span className={mv.vivo} aria-hidden="true" /> : null}
      {chip.texto}
    </span>
  );
}

/**
 * Board CD-10's month: title, chip, progress, the seven steps and «Cerrar» or
 * «Pedir reabrir». With ADR-161's motion (board CD-21d) it lands with the
 * sweep, its steps enter with their checkmarks drawing and the bar fills.
 */
export function DelMes(props: {
  readonly mes: string;
  readonly enc: EncabezadoCierre;
  readonly pasos: readonly PasoVista[];
  /** The month was closed by the action that brought the founder here. */
  readonly sello: boolean;
}) {
  const { mes, enc, pasos } = props;
  return (
    <section
      className={`${m.hero} ${m.stack} ${mv.aterriza} ${mv.barrido}`}
      aria-labelledby="cierre-titulo"
      data-testid="cierre-mes"
    >
      <div className={i.cabeza}>
        <div>
          <span className={m.eyebrow}>{`Cierre de ${nombreMes(mes)}`}</span>
          <h2 id="cierre-titulo" className={i.total}>
            {enc.titulo}
          </h2>
          <span className={i.muted}>{enc.subtitulo}</span>
        </div>
        <Chip chip={enc.chip} sello={props.sello} />
      </div>
      <Progreso enc={enc} total={pasos.length} />
      <ol className={`${k.pasos} ${mv.escalona}`} aria-label="Pasos del cierre">
        {pasos.map((p) => (
          <UnPaso key={p.id} mes={mes} p={p} />
        ))}
      </ol>
      <Pie mes={mes} enc={enc} />
    </section>
  );
}
