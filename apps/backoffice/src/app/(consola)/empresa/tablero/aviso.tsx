import { avisoEnviado, prepararAviso, type AvisoGuardado } from '@xangarro/application/corp';
import {
  nombreTrimestre,
  otroSocio,
  TableroError,
  textoDelAviso,
  type Aviso,
  type Socio,
  type TextoAviso,
} from '@xangarro/domain/corp';

import { Cajon } from '@/components/cajon';
import { fechaCorta } from '@/server/empresa/fechas';
import type { LecturaTablero } from '@/server/empresa/tablero-lectura';
import { hrefTablero } from '@/server/empresa/tablero-view';
import * as i from '@/styles/mostrador-impuestos.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { ClausulaForm, MarcarAvisoForm } from './formas-plan';

/**
 * «Aviso de incumplimiento» (board CD-13d): the clause typed in once, then
 * the draft from the decided quarter with its PDF, then the day it was sent.
 * The console never sends it: the partner who cumplió does.
 */
const EXPEDIENTE = '/empresa/expediente?carpeta=acuerdo_socios';

type Props = { readonly l: LecturaTablero; readonly trimestre: string; readonly yo: Socio };

function Texto({ texto }: { readonly texto: TextoAviso }) {
  return (
    <article className={`${m.panelPad} ${m.stack}`}>
      <span className={i.pasoTitulo}>{texto.titulo}</span>
      <span className={i.pasoSub}>Para: {texto.para}</span>
      <span className={i.pasoSub}>De: {texto.de}</span>
      {texto.cuerpo.map((p) => (
        <span key={p} className={i.pasoSub}>
          {p}
        </span>
      ))}
      {texto.lista.map((l) => (
        <span key={l} className={t.leyenda}>
          • {l}
        </span>
      ))}
      <span className={i.pasoSub}>{texto.conforme}</span>
      <blockquote className={t.cita}>{texto.cita}</blockquote>
    </article>
  );
}

function Borrador({ a, l, trimestre, yo }: Props & { readonly a: Aviso }) {
  return (
    <div className={m.stack} data-testid="aviso-borrador">
      <Texto texto={textoDelAviso(a, l.nombres)} />
      <a className={m.boton.secundario} href={`/empresa/tablero/aviso?t=${trimestre}`}>
        Descargar el PDF
      </a>
      {yo === a.de ? (
        <MarcarAvisoForm trimestre={trimestre} hoy={l.hoy} />
      ) : (
        <span className={i.muted}>{`Lo manda ${l.nombres[a.de]}, que cumplió.`}</span>
      )}
      <span className={i.muted}>
        La consola no lo manda: lo envías tú como pide el acuerdo. Al marcarlo enviado se guarda en
        el Expediente, en Acuerdo de socios.
      </span>
    </div>
  );
}

function Enviado({ a, l }: { readonly a: AvisoGuardado; readonly l: LecturaTablero }) {
  return (
    <div className={m.stack} data-testid="aviso-enviado">
      <span
        className={i.pasoTitulo}
      >{`Enviado el ${fechaCorta(a.enviadoEl)} por ${l.nombres[otroSocio(a.para)]}`}</span>
      <span className={i.muted}>
        Guardado en el Expediente, en Acuerdo de socios, con la cláusula como estaba ese día.
      </span>
      <a className={m.boton.secundario} href={`/empresa/documentos/${a.documentoId}`}>
        Descargar el PDF
      </a>
      <a className={m.boton.quieto} href={EXPEDIENTE}>
        Ver en el Expediente
      </a>
    </div>
  );
}

function SinClausula({ trimestre }: { readonly trimestre: string }) {
  return (
    <div className={m.stack}>
      <span className={i.pasoSub}>
        Para preparar el aviso hace falta la cláusula del acuerdo de socios que fija la
        consecuencia. Se escribe una vez y cada aviso la cita palabra por palabra.
      </span>
      <ClausulaForm trimestre={trimestre} />
      <a className={m.boton.quieto} href={EXPEDIENTE}>
        Ver el acuerdo en el Expediente
      </a>
    </div>
  );
}

function Cuerpo(props: Props) {
  const { l, trimestre } = props;
  const enviado = avisoEnviado(l.datos, trimestre);
  if (enviado !== null) return <Enviado a={enviado} l={l} />;
  if (l.datos.clausula === null) return <SinClausula trimestre={trimestre} />;
  try {
    return <Borrador {...props} a={prepararAviso(l.datos, trimestre, l.hoy)} />;
  } catch (error) {
    if (error instanceof TableroError) return <span className={i.pasoSub}>{error.message}</span>;
    throw error;
  }
}

export function AvisoCajon(props: Props) {
  return (
    <Cajon
      eyebrow={`Cierre del ${nombreTrimestre(props.trimestre)}`}
      titulo="Aviso de incumplimiento"
      sub="Los datos vienen del tablero del trimestre."
      cerrar={hrefTablero(props.trimestre)}
      ancho="amplio"
    >
      <Cuerpo {...props} />
    </Cajon>
  );
}
