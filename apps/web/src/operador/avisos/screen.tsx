'use client';

import { Don } from '@/components/don/don';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { ICONS } from '@xangarro/caja';
import { PageHead } from '../ui/panel';
import * as p from '../ui/panel.css';
import { OpMain } from '../ui/parts';
import { Toast } from '../ui/toast';
import * as a from './avisos.css';
import { AvisoCard } from './card';
import * as r from './reply.css';
import { AvisoSistema } from './sistema';
import { AVISOS_COPY, type AvisoGrupo, type AvisosScreenProps } from '@xangarro/caja/avisos';
import { useAvisos } from './use-avisos';

const TABS: readonly [AvisoGrupo, string][] = [
  ['dueno', AVISOS_COPY.tab],
  ['caja', 'De tu caja'],
];

const LEIDO = 'M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16';

/**
 * Operador · Avisos: the owner's messages and the register's own notices.
 * Read state and replies live on the device until the message tables land
 * (ADR-075, C-19); the corte reply is answered in place.
 */
export function AvisosScreen({ state, data, tab: initialTab, vivo }: AvisosScreenProps) {
  const v = useAvisos(data, initialTab, vivo);
  return (
    <OpMain top={24}>
      <div className={a.head}>
        <PageHead title="Avisos" sub={AVISOS_COPY.sub} />
        <button type="button" className={`${p.quietBtn} ${a.marcarTodo}`} onClick={v.markAll}>
          <Icon path={LEIDO} size={18} strokeWidth={2.2} />
          Marcar todo como leído
        </button>
      </div>
      <Tabs v={v} />
      {state === 'happy' ? (
        <Lista v={v} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={ICONS.bell}
          emptyTitle="Nada por leer"
          emptyBody={AVISOS_COPY.vacio}
          errorTitle="No pudimos cargar tus avisos"
        />
      )}
      {v.toast ? <Toast title="Respuesta enviada" body={v.toast} onClose={v.closeToast} /> : null}
    </OpMain>
  );
}

type Avisos = ReturnType<typeof useAvisos>;

function Tabs({ v }: { readonly v: Avisos }) {
  return (
    <div role="tablist" aria-label="Quién avisa" className={a.tabs}>
      {TABS.map(([key, label]) => {
        const n = v.sinLeer(key);
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={v.tab === key}
            className={a.tab}
            onClick={() => v.setTab(key)}
          >
            {n ? `${label} · ${n}` : label}
          </button>
        );
      })}
    </div>
  );
}

function Lista({ v }: { readonly v: Avisos }) {
  if (v.visibles.length === 0) return <NadaPorLeer tab={v.tab} />;
  if (v.tab === 'caja') {
    return (
      <div role="tabpanel" className={a.listCaja}>
        {v.visibles.map((x) => (
          <AvisoSistema key={x.id} aviso={x} />
        ))}
      </div>
    );
  }
  return (
    <div role="tabpanel" className={a.list}>
      {v.visibles.map((x) => (
        <AvisoCard
          key={x.id}
          aviso={x}
          draft={v.draft}
          onDraft={v.setDraft}
          onSend={() => v.send(x)}
          onRead={() => v.markRead(x.id)}
        />
      ))}
    </div>
  );
}

/** Don Cuentas with his book, on the empty tab. */
function NadaPorLeer({ tab }: { readonly tab: AvisoGrupo }) {
  return (
    <div role="tabpanel" className={r.empty}>
      <Don pose="ayuda" size={96} />
      <span className={r.emptyTitle}>Nada por leer</span>
      <span className={r.emptyBody}>
        {tab === 'dueno' ? AVISOS_COPY.nadaNuevo : 'Tu caja no tiene avisos del sistema.'}
      </span>
    </div>
  );
}
