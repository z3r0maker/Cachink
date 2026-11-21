import { Cajon } from '@/components/cajon';
import type { CajonTarjeta } from '@/server/empresa/tablero-cajon';
import { hrefTablero } from '@/server/empresa/tablero-view';
import * as i from '@/styles/mostrador-impuestos.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { BotonMover, MotivoForm, ResolverForm, TerminarForm } from './formas-mover';
import { CotizacionForm, QuitarForm, ValorForm, type Ids } from './formas-tarjeta';

/**
 * A card's drawer (board CD-13c): its criterion in full, both values and the
 * one used, then what this partner may do now, and the card's history.
 */
function Valor({ c, ids }: { readonly c: CajonTarjeta; readonly ids: Ids }) {
  return (
    <div className={m.stack}>
      <span className={m.tileLabel}>Valor</span>
      <span className={i.pasoSub} data-testid="tarjeta-valores">
        {c.valores}
      </span>
      {c.valorNota === null ? null : <span className={t.leyenda}>{c.valorNota}</span>}
      {c.acciones.proponer ? <ValorForm ids={ids} /> : null}
      {c.acciones.cotizar ? <CotizacionForm ids={ids} /> : null}
    </div>
  );
}

function Revision({ c, ids }: { readonly c: CajonTarjeta; readonly ids: Ids }) {
  return (
    <div className={m.stack} data-testid="tarjeta-revision">
      <span className={i.pasoTitulo}>{c.plazo}</span>
      {c.evidencia === null ? null : (
        <a
          className={m.boton.secundario}
          href={c.evidencia.href}
          target="_blank"
          rel={c.evidencia.externo ? 'noopener noreferrer' : undefined}
        >
          Ver la evidencia
        </a>
      )}
      <BotonMover ids={ids} accion="aceptar" texto="Aceptar ya" primario />
      <MotivoForm
        ids={ids}
        accion="objetar"
        label="¿Qué parte del criterio no se cumple?"
        texto="Objetar"
      />
    </div>
  );
}

function Movimientos({ c, ids }: { readonly c: CajonTarjeta; readonly ids: Ids }) {
  const a = c.acciones;
  return (
    <>
      {a.iniciar ? <BotonMover ids={ids} accion="iniciar" texto="Empezar" /> : null}
      {a.hacer ? <BotonMover ids={ids} accion="hacer" texto="Marcar hecha" primario /> : null}
      {a.terminar ? (
        <TerminarForm
          ids={ids}
          plazo="El otro socio tendrá diez días para objetar. Si no objeta, queda aceptado solo."
        />
      ) : null}
      {a.revisar ? <Revision c={c} ids={ids} /> : null}
      {!a.revisar && c.plazo !== null ? <span className={i.muted}>{c.plazo}</span> : null}
      {a.mediador ? (
        <MotivoForm
          ids={ids}
          accion="mediador"
          label="¿Por qué la llevas al mediador?"
          texto="Llevar al mediador"
        />
      ) : null}
      {a.resolver ? <ResolverForm ids={ids} /> : null}
      {a.quitar ? <QuitarForm ids={ids} /> : null}
    </>
  );
}

function Historia({ c }: { readonly c: CajonTarjeta }) {
  if (c.historia.length === 0) return null;
  return (
    <div className={m.stack}>
      <span className={m.tileLabel}>Historia</span>
      <ol className={t.historia} data-testid="tarjeta-historia">
        {c.historia.map((h, n) => (
          <li key={`${h.cuando}-${n}`}>
            <span className={t.leyenda}>
              {h.quien} · {h.cuando}
            </span>
            <br />
            <span className={i.pasoSub}>{h.texto}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TarjetaCajon({
  c,
  trimestre,
  sello,
}: {
  readonly c: CajonTarjeta;
  readonly trimestre: string;
  readonly sello: boolean;
}) {
  const ids: Ids = { t: trimestre, tarjeta: c.id, titulo: c.titulo };
  return (
    <Cajon eyebrow={c.eyebrow} titulo={c.titulo} sub={c.sub} cerrar={hrefTablero(trimestre)}>
      <div className={m.stack} data-testid="tarjeta-cajon">
        {c.estado === null ? null : (
          <span className={`${t.estado} ${i.tono[c.tono]}${sello ? ` ${mv.sello}` : ''}`}>
            {c.estado}
          </span>
        )}
        {c.criterio === '' ? null : (
          <div className={m.stack}>
            <span className={m.tileLabel}>Criterio de terminado</span>
            <span className={i.pasoSub}>{c.criterio}</span>
          </div>
        )}
        {c.entregable ? <Valor c={c} ids={ids} /> : null}
        <Movimientos c={c} ids={ids} />
        <Historia c={c} />
      </div>
    </Cajon>
  );
}
