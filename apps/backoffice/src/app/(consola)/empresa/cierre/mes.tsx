import type { Route } from 'next';
import Link from 'next/link';

import type { EncabezadoCierre } from '@/server/empresa/cierre-encabezado';
import type { PasoVista } from '@/server/empresa/cierre-pasos';
import { nombreMes } from '@/server/empresa/fechas';
import * as k from '@/styles/mostrador-cierre.css';
import * as i from '@/styles/mostrador-impuestos.css';
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function UnPaso({ mes, p }: { readonly mes: string; readonly p: PasoVista }) {
  const listo = p.estado !== 'pendiente';
  return (
    <li
      className={k.fila[listo ? 'hecho' : 'pendiente']}
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
      <div className={k.barra} aria-hidden="true">
        {Array.from({ length: total }, (_, n) => (
          <span
            key={n}
            className={k.tramo[n >= enc.hechos ? 'vacio' : enc.cerrado ? 'cerrado' : 'hecho']}
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
      <span className={k.nota}>{enc.cierreTexto}</span>
    </div>
  );
}

/** Board CD-10's month: title, chip, progress, the seven steps and «Cerrar» or «Pedir reabrir». */
export function DelMes(props: {
  readonly mes: string;
  readonly enc: EncabezadoCierre;
  readonly pasos: readonly PasoVista[];
}) {
  const { mes, enc, pasos } = props;
  const chip = enc.chip.tono === 'cerrado' ? k.chipCerrado : i.tono[enc.chip.tono];
  return (
    <section
      className={`${m.hero} ${m.stack}`}
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
        <span className={`${i.chipBase} ${chip}`} data-testid="cierre-chip">
          {enc.chip.texto}
        </span>
      </div>
      <Progreso enc={enc} total={pasos.length} />
      <ol className={k.pasos} aria-label="Pasos del cierre">
        {pasos.map((p) => (
          <UnPaso key={p.id} mes={mes} p={p} />
        ))}
      </ol>
      <Pie mes={mes} enc={enc} />
    </section>
  );
}
