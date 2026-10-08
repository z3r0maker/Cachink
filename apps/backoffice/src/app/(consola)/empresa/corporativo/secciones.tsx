import type { DocumentoMeta, Registro } from '@xangarro/application/corp';
import type { Founder } from '@xangarro/data-corp';
import { formatMoney } from '@xangarro/domain';
import { certificadosVigentes, type Certificado, type Socio } from '@xangarro/domain/corp';
import Link from 'next/link';

import { acciones, filaCertificado, lineaSocio } from '@/server/empresa/corporativo-view';
import type { LibroCorporativo } from '@/server/empresa/corporativo-lectura';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { ListaDocumentos } from '../lista-documentos';
import { CertificadoForm } from './formas';

/** The corporate book's four parts (E-06, board CD-05 Corporativo). */
function Cifra({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={s.figure}>
      <span className={s.figureLabel}>{label}</span>
      <span className={s.figureValue}>{value}</span>
    </div>
  );
}

function TarjetaSocio({ f, libro }: { readonly f: Founder; readonly libro: LibroCorporativo }) {
  return (
    <div className={s.who} data-testid={`tenencia-${f.numero}`}>
      <span className={s.avatar[f.numero]}>F{f.numero}</span>
      <span>
        <span className={s.whoName}>
          Fundador {f.numero} · {f.nombre}
        </span>
        <span className={a.itemBasis}>{lineaSocio(f.numero, libro.tenencias)}</span>
      </span>
    </div>
  );
}

export function SociosYAcciones(props: {
  readonly libro: LibroCorporativo;
  readonly beneficiario: string;
}) {
  const { libro } = props;
  const nombre = (n: Socio | null) =>
    n === null
      ? 'Sin definir'
      : `Fundador ${n} · ${libro.socios.find((f) => f.numero === n)?.nombre ?? ''}`;
  return (
    <section
      className={`${m.hero} ${m.stack}`}
      aria-labelledby="socios-acciones"
      data-testid="socios-acciones"
    >
      <div className={m.head}>
        <h2 id="socios-acciones" className={`${s.heroTitle} ${m.headText}`}>
          Socios y acciones
        </h2>
        <Link className={m.boton.secundario} href="/empresa/corporativo/acciones">
          Registrar acciones
        </Link>
      </div>
      <div className={s.grid2}>
        {libro.socios.map((f) => (
          <TarjetaSocio key={f.id} f={f} libro={libro} />
        ))}
      </div>
      <div className={s.figures}>
        <Cifra
          label="Capital"
          value={`${acciones(libro.tenencias.total)} acciones · pagado ${formatMoney(libro.capitalPagado)}`}
        />
        <Cifra label="Administrador" value={nombre(libro.administrador)} />
        <Cifra label="Beneficiario controlador" value={props.beneficiario} />
      </div>
    </section>
  );
}

function FilaRegistro({ r }: { readonly r: Registro }) {
  return (
    <li className={a.item} data-testid="registro">
      <span className={a.chip[r.alDia ? 'ok' : 'warn']}>{r.estado}</span>
      <span>
        <span className={a.whenDate}>{r.nombre}</span>
        <span className={a.itemBasis}>
          {[r.autoridad, r.referencia].filter(Boolean).join(' · ')}
          {r.siguiente === '' ? '' : ` · ${r.siguiente}`}
        </span>
      </span>
      <span className={m.row}>
        {r.documentoId === null ? null : (
          <a
            className={m.boton.quieto}
            href={`/empresa/documentos/${r.documentoId}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver
          </a>
        )}
        <Link className={m.boton.secundario} href={`/empresa/corporativo/registros/${r.id}`}>
          Actualizar
        </Link>
      </span>
    </li>
  );
}

export function Registros({ registros }: { readonly registros: readonly Registro[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="registros">
      <h2 id="registros" className={s.sectionTitle}>
        Registros y trámites
      </h2>
      <ul className={a.list}>
        {registros.map((r) => (
          <FilaRegistro key={r.id} r={r} />
        ))}
      </ul>
    </section>
  );
}

export function Actas({ docs }: { readonly docs: readonly DocumentoMeta[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="actas">
      <div className={m.head}>
        <h2 id="actas" className={`${s.sectionTitle} ${m.headText}`}>
          Actas y documentos de la sociedad
        </h2>
        <Link className={m.boton.secundario} href="/empresa/expediente/subir?carpeta=constitucion">
          + Subir documento
        </Link>
      </div>
      <ListaDocumentos
        docs={docs}
        vacio="Todavía no hay actas ni documentos."
        detalle={(d) => d.titulo}
      />
      <span className={a.authority}>
        Se guardan en el Expediente, carpetas «Constitución» y «Acuerdo de socios».
      </span>
    </section>
  );
}

export function Firmas({
  certs,
  hoy,
}: {
  readonly certs: readonly Certificado[];
  readonly hoy: string;
}) {
  const filas = certificadosVigentes(certs).map((c) => filaCertificado(c, hoy));
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="firmas">
      <h2 id="firmas" className={s.sectionTitle}>
        Firmas y certificados
      </h2>
      <span className={a.authority}>
        Aquí solo guardamos vigencias, nunca archivos de llave ni contraseñas.
      </span>
      <ul className={a.list}>
        {filas.map((f) => (
          <li key={f.id} className={a.itemWide} data-testid="certificado">
            <span className={a.whenDate}>{f.nombre}</span>
            <span className={a.chip[f.tono]}>{f.vence}</span>
          </li>
        ))}
      </ul>
      <CertificadoForm />
    </section>
  );
}
