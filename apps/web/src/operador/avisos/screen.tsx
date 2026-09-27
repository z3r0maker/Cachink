'use client';

import { Don } from '@/components/don/don';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { ICONS } from '../shell/nav';
import { PageHead } from '../ui/panel';
import * as p from '../ui/panel.css';
import { OpMain } from '../ui/parts';
import { Toast } from '../ui/toast';
import * as a from './avisos.css';
import { AvisoCard } from './card';
import * as r from './reply.css';
import { AvisoSistema } from './sistema';
import type { AvisoGrupo, AvisosScreenProps } from './types';
import { useAvisos } from './use-avisos';
import { deDueno, mayuscula } from './vivo';

const TABS: readonly [AvisoGrupo, string][] = [
  ['dueno', 'De Pedro'],
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
        <PageHead title="Avisos" sub={`Lo que te manda ${data.dueno} y lo que la caja te avisa`} />
        <button type="button" className={`${p.quietBtn} ${a.marcarTodo}`} onClick={v.markAll}>
          <Icon path={LEIDO} size={18} strokeWidth={2.2} />
          Marcar todo como leído
        </button>
      </div>
      <Tabs v={v} dueno={data.dueno} />
      {state === 'happy' ? (
        <Lista v={v} dueno={data.dueno} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={ICONS.bell}
          emptyTitle="Nada por leer"
          emptyBody={`Ni mensajes ${deDueno(data.dueno)} ni avisos de tu caja.`}
          errorTitle="No pudimos cargar tus avisos"
        />
      )}
      {v.toast ? <Toast title="Respuesta enviada" body={v.toast} onClose={v.closeToast} /> : null}
    </OpMain>
  );
}

type Avisos = ReturnType<typeof useAvisos>;

function Tabs({ v, dueno }: { readonly v: Avisos; readonly dueno: string }) {
  return (
    <div role="tablist" aria-label="Quién avisa" className={a.tabs}>
      {TABS.map(([key, label]) => {
        const n = v.sinLeer(key);
        const text = key === 'dueno' ? mayuscula(deDueno(dueno)) : label;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={v.tab === key}
            className={a.tab}
            onClick={() => v.setTab(key)}
          >
            {n ? `${text} · ${n}` : text}
          </button>
        );
      })}
    </div>
  );
}

function Lista({ v, dueno }: { readonly v: Avisos; readonly dueno: string }) {
  if (v.visibles.length === 0) return <NadaPorLeer tab={v.tab} dueno={dueno} />;
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
          dueno={dueno}
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
function NadaPorLeer({ tab, dueno }: { readonly tab: AvisoGrupo; readonly dueno: string }) {
  return (
    <div role="tabpanel" className={r.empty}>
      <Don pose="ayuda" size={96} />
      <span className={r.emptyTitle}>Nada por leer</span>
      <span className={r.emptyBody}>
        {tab === 'dueno'
          ? `${mayuscula(dueno)} no te ha escrito nada nuevo.`
          : 'Tu caja no tiene avisos del sistema.'}
      </span>
    </div>
  );
}
