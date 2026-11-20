import type { Route } from 'next';
import Link from 'next/link';

import { Cajon } from '@/components/cajon';
import { HREF_CODIGOS, hrefCierre } from '@/server/empresa/cierre-view';
import type { FilaVista, VistaPaquete } from '@/server/empresa/contador-view';
import { nombreMes } from '@/server/empresa/fechas';
import * as k from '@/styles/mostrador-cierre.css';
import * as t from '@/styles/mostrador-contador.css';
import * as d from '@/styles/mostrador-data.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { IconoArchivo, IconoDescargar } from './iconos';

/**
 * «Paquete para el contador» (E-43, board CD-10d): what goes in the month's
 * package and the balanza as its CSV writes it, then the download. A plain
 * link: the browser saves the .zip the route builds.
 */
function Partes({ v }: { readonly v: VistaPaquete }) {
  return (
    <section aria-labelledby="paquete-contenido" data-testid="paquete-partes">
      <h3 id="paquete-contenido" className={m.eyebrow}>
        Qué lleva
      </h3>
      {v.partes.map((p) => (
        <div key={p.nombre} className={t.parte} data-testid="paquete-parte">
          <IconoArchivo />
          <span className={t.parteTexto}>
            <span className={t.parteNombre}>{p.nombre}</span>
            <span className={t.detalle[p.aviso ? 'aviso' : 'normal']}>{p.detalle}</span>
          </span>
          <span className={t.archivo}>{p.archivo}</span>
        </div>
      ))}
    </section>
  );
}

const TEXTO = ['Código', 'Cuenta'] as const;
const CIFRAS = ['Saldo inicial', 'Debe', 'Haber', 'Saldo final'] as const;

function Fila({ f }: { readonly f: FilaVista }) {
  return (
    <tr data-cuenta={f.cuenta}>
      <td className={d.td}>
        {f.codigo === null ? (
          <span className={t.sinCodigo}>Sin código</span>
        ) : (
          <span className={t.codigo}>{f.codigo}</span>
        )}
      </td>
      <td className={d.tdStrong}>{f.nombre}</td>
      {[f.inicial, f.debe, f.haber, f.final].map((x, n) => (
        <td key={CIFRAS[n]} className={d.tdNum}>
          {x}
        </td>
      ))}
    </tr>
  );
}

function Tabla({ v }: { readonly v: VistaPaquete }) {
  return (
    <table className={d.table} data-testid="paquete-balanza">
      <thead>
        <tr>
          {[...TEXTO, ...CIFRAS].map((h, n) => (
            <th key={h} scope="col" className={n < TEXTO.length ? d.th : d.thNum}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {v.filas.map((f) => (
          <Fila key={f.cuenta} f={f} />
        ))}
        <tr>
          <td colSpan={3} className={t.celdaTotal} data-testid="paquete-cuadra">
            {v.total.texto}
          </td>
          <td className={t.celdaTotalNum}>{v.total.debe}</td>
          <td className={t.celdaTotalNum}>{v.total.haber}</td>
          <td className={t.celdaTotal} />
        </tr>
      </tbody>
    </table>
  );
}

function Balanza({ v }: { readonly v: VistaPaquete }) {
  return (
    <section aria-labelledby="paquete-balanza" className={m.stack}>
      <h3 id="paquete-balanza" className={m.eyebrow}>
        La balanza, como sale en el CSV
      </h3>
      <div className={d.tableWrap}>
        <Tabla v={v} />
      </div>
      <span className={i.muted}>
        {`Las ${v.filas.length} cuentas, también las que no se movieron, cada una en su naturaleza: deudoras y acreedoras en positivo.`}
      </span>
    </section>
  );
}

function AvisoCodigos({ aviso }: { readonly aviso: NonNullable<VistaPaquete['aviso']> }) {
  return (
    <div className={i.aviso} role="status" data-testid="paquete-aviso">
      <span>
        <span className={i.pasoTitulo}>{aviso.titulo}</span>
        <span className={i.pasoSub}>{aviso.texto}</span>
      </span>
      <Link className={m.boton.secundario} href={HREF_CODIGOS as Route}>
        Ver los códigos
      </Link>
    </div>
  );
}

export function PanelContador({ mes, v }: { readonly mes: string; readonly v: VistaPaquete }) {
  return (
    <Cajon
      eyebrow={`Cierre · ${nombreMes(mes)} de ${mes.slice(0, 4)}`}
      titulo="Paquete para el contador"
      sub={v.sub}
      cerrar={hrefCierre(mes)}
      ancho="amplio"
    >
      <div className={m.stack}>
        <span
          className={`${i.chipBase} ${v.chip === 'Final' ? k.chipCerrado : i.tono.warn}`}
          data-testid="paquete-chip"
        >
          {v.chip}
        </span>
        {v.aviso === null ? null : <AvisoCodigos aviso={v.aviso} />}
        <Partes v={v} />
        <Balanza v={v} />
        <div className={m.row}>
          <a
            className={m.boton.primario}
            href={v.href}
            download={v.zip}
            data-testid="paquete-descargar"
          >
            <IconoDescargar />
            {v.boton}
          </a>
          <span className={t.archivo}>{v.zip}</span>
        </div>
        <span className={i.muted}>{v.nota}</span>
      </div>
    </Cajon>
  );
}
