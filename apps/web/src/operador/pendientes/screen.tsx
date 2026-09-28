'use client';

import { Don } from '@/components/don/don';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { PageHead } from '../ui/panel';
import * as pc from '../ui/panel.css';
import { OpMain } from '../ui/parts';
import {
  ayudaReintento,
  despuesDeReintentar,
  heroe,
  intro,
  portalDe,
  type PendientesScreenProps,
} from '@xangarro/caja/pendientes';
import * as i from './intentos.css';
import { ListaCola } from './lista';
import * as s from './pendientes.css';
import { usePendientes } from './use-pendientes';

const SYNC =
  'M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5';
const CHECK = 'M20 6 9 17l-5-5';

/** Operador · Registros por enviar: the local queue, its retry, and the rule not to lose it. */
export function PendientesScreen({
  state,
  cola: inicial,
  dueno = 'Pedro',
  vivo,
}: PendientesScreenProps) {
  const x = usePendientes(inicial, vivo);
  // A linked caja shows no hero until its queue is read: an empty list is not «Todo enviado».
  const conHeroe = vivo === undefined || state === 'happy';
  return (
    <OpMain top={24}>
      <PageHead title="Registros por enviar" sub={intro(x.cola.length === 0, dueno)} />
      <div className={s.column}>
        {conHeroe ? <HeroeCola x={x} /> : null}
        {state === 'happy' ? (
          <ListaCola
            cola={x.cola}
            fase={x.fase}
            offline={x.offline}
            portal={portalDe(dueno)}
            ahora={x.ahora}
            reintento={x.reintento}
          />
        ) : (
          <OperadorEstado
            mode={state}
            icon={SYNC}
            emptyTitle="Nada pendiente"
            emptyBody={`Todo lo que capturaste ya está en ${portalDe(dueno)}.`}
            errorTitle="No pudimos leer la cola de este navegador"
          />
        )}
        <NadaSePierde />
      </div>
    </OpMain>
  );
}

/** Money figures inside a sentence, set bold and tabular. */
function ConCifras({ text }: { readonly text: string }) {
  const parts = text.split(/(\$[\d,]+\.\d{2})/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className={s.cifra}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** The hero changes with the phase: amber waiting, blue sending (spinning), green sent. */
function HeroeCola({ x }: { readonly x: ReturnType<typeof usePendientes> }) {
  const h = heroe(x.fase, x.cola, x.enCola);
  const enviando = x.fase === 'enviando';
  return (
    <section aria-labelledby="pend-t" className={`${s.heroe} ${s.fase[x.fase]}`}>
      <span className={`${s.heroeTile} ${s.faseTexto[x.fase]}`}>
        <span className={enviando ? s.girando : undefined} style={{ display: 'grid' }}>
          <Icon path={x.fase === 'enviado' ? CHECK : SYNC} size={34} strokeWidth={2.2} />
        </span>
      </span>
      <div className={s.heroeText}>
        <span className={`${s.eyebrow} ${s.faseTexto[x.fase]}`}>{h.eyebrow}</span>
        <h2 id="pend-t" className={s.heroeTitulo}>
          {h.titulo}
        </h2>
        {x.fase === 'reintentando' ? (
          <p className={i.ayuda}>{ayudaReintento(x.reintento)}</p>
        ) : null}
        <p className={s.heroeCuerpo}>
          <ConCifras text={h.cuerpo} />
        </p>
        {x.fase === 'reintentando' ? (
          <span role="status" className={i.estado}>
            {x.intentado ? despuesDeReintentar(x.reintento) : ''}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className={`${pc.primaryBtn} ${s.reintentarVivo}`}
        data-enviando={enviando ? '' : undefined}
        aria-busy={enviando}
        onClick={x.reintentar}
      >
        {h.boton}
      </button>
    </section>
  );
}

/** Don Cuentas with his book: nothing is lost, and the close need not wait (DS-06). */
function NadaSePierde() {
  return (
    <section aria-label="Nada se pierde" className={s.nota}>
      <Don pose="ayuda" size={90} />
      <div className={s.notaBurbuja}>
        <span className={s.notaTitulo}>Nada se pierde</span>
        <span className={s.notaTexto}>
          Lo que capturas vive en esta caja hasta que suba. No borres los datos del navegador.
          Puedes cerrar el turno; se envían cuando vuelva la conexión.
        </span>
      </div>
    </section>
  );
}
