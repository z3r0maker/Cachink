import { CUENTAS_DEL_CATALOGO } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { hrefCierre, parseMesCierre } from '@/server/empresa/cierre-view';
import { vistaDeCodigos, type VistaCodigos } from '@/server/empresa/codigos-view';
import { leerCodigos } from '@/server/empresa/contador-lectura';
import { requireFounderPage } from '@/server/founder';
import * as t from '@/styles/mostrador-contador.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../../encabezado-seccion';
import { CodigosForm, ValidarForm } from './formas';

export const dynamic = 'force-dynamic';

function Acciones({ v }: { readonly v: VistaCodigos }) {
  return (
    <div className={m.row}>
      <a
        className={m.boton.secundario}
        href="/empresa/cierre/codigos/lista"
        download="mexia-cuentas-para-el-contador.csv"
      >
        Descargar la lista para el contador
      </a>
      {v.validar === null ? null : <ValidarForm listaId={v.validar.listaId} hoy={v.validar.hoy} />}
      {v.noValidar === null ? null : (
        <>
          <button className={m.boton.quieto} type="button" disabled>
            Marcar como validada
          </button>
          <span className={i.muted}>{v.noValidar}</span>
        </>
      )}
    </div>
  );
}

function Estado({ v }: { readonly v: VistaCodigos }) {
  return (
    <section
      className={`${m.hero} ${m.stack}`}
      aria-labelledby="codigos-titulo"
      data-testid="codigos-estado"
    >
      <div className={i.cabeza}>
        <div>
          <span className={m.eyebrow}>Códigos agrupadores del SAT</span>
          <h2 id="codigos-titulo" className={i.total}>
            {v.titulo}
          </h2>
          <span className={i.muted}>{v.texto}</span>
        </div>
        <span className={`${i.chipBase} ${i.tono[v.chip.tono]}`} data-testid="codigos-chip">
          {v.chip.texto}
        </span>
      </div>
      {v.pasos ? (
        <ol className={t.pasos}>
          <li>Descarga la lista de cuentas y mándasela al contador.</li>
          <li>Escribe junto a cada cuenta el código que te devuelva.</li>
          <li>Marca la lista como validada, con la fecha en que la validó.</li>
        </ol>
      ) : null}
      <Acciones v={v} />
    </section>
  );
}

/**
 * Cierre del mes › Códigos agrupadores (E-43, board CD-10e): the console's
 * accounts with the code the contador gave each one, and the list marked as
 * validated with the day they did. The contador's package exports by them.
 */
export default async function CodigosPage() {
  await requireFounderPage();
  const hoy = hoyEnMexico();
  const { estado, socios } = await leerCodigos();
  const v = vistaDeCodigos(estado, socios, hoy);
  return (
    <div className={m.page}>
      <EncabezadoSeccion
        actual="/empresa/cierre"
        sub={`Códigos agrupadores · las ${CUENTAS_DEL_CATALOGO.length} cuentas de la consola`}
      >
        <Link
          className={m.boton.secundario}
          href={hrefCierre(parseMesCierre(undefined, hoy)) as Route}
        >
          Volver al cierre
        </Link>
      </EncabezadoSeccion>
      <Estado v={v} />
      <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="codigos-cuentas">
        <div className={i.cabeza}>
          <h2 id="codigos-cuentas" className={m.eyebrow}>
            Cuentas y su código
          </h2>
          <span className={i.muted}>El código como lo escribe el contador, por ejemplo 102.01</span>
        </div>
        <CodigosForm v={v} />
      </section>
    </div>
  );
}
