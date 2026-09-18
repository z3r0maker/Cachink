'use client';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import * as h from '../shell/actions.css';
import { ICONS } from '../shell/nav';
import { HeaderAction } from '../shell/shell';
import { OpMain } from '../ui/parts';
import { Toast } from '../ui/toast';
import * as a from './avisos.css';
import { AvisoCard } from './card';
import * as r from './reply.css';
import type { AvisoGrupo, AvisosScreenProps } from './types';
import { useAvisos } from './use-avisos';

const TABS: readonly [AvisoGrupo, string][] = [
  ['dueno', 'De Pedro'],
  ['caja', 'De tu caja'],
];

/**
 * Operador · Avisos: the owner's messages and the register's own notices.
 * Read state and replies live on the device until the message tables land
 * (ADR-075, C-19); the corte reply is answered in place.
 */
export function AvisosScreen({ state, data, tab: initialTab }: AvisosScreenProps) {
  const v = useAvisos(data, initialTab);
  return (
    <OpMain top={24} narrow>
      <HeaderAction>
        <button type="button" className={h.plainAction} onClick={v.markAll}>
          Marcar todo como leído
        </button>
      </HeaderAction>
      <div>
        <h1 className={a.h1}>Avisos</h1>
        <div className={a.sub}>
          Lo que te manda {data.dueno} y lo que el sistema te avisa de tu caja.
        </div>
      </div>
      <Tabs v={v} dueno={data.dueno} />
      {state === 'happy' ? (
        <Lista v={v} dueno={data.dueno} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={ICONS.bell}
          emptyTitle="Nada por leer"
          emptyBody={`Ni mensajes de ${data.dueno} ni avisos de tu caja.`}
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
    <div className={r.tabs} role="tablist">
      {TABS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={v.tab === key}
          className={r.tab}
          onClick={() => v.setTab(key)}
        >
          {label.replace('Pedro', dueno)}
          <span className={r.tabCount}>{v.sinLeer(key)}</span>
        </button>
      ))}
    </div>
  );
}

function Lista({ v, dueno }: { readonly v: Avisos; readonly dueno: string }) {
  return (
    <div className={a.list}>
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
      {v.visibles.length === 0 ? <NadaPorLeer tab={v.tab} dueno={dueno} /> : null}
    </div>
  );
}

const CHECK = 'M20 6 9 17l-5-5';

function NadaPorLeer({ tab, dueno }: { readonly tab: AvisoGrupo; readonly dueno: string }) {
  return (
    <div className={r.empty}>
      <div className={r.emptyTile}>
        <Icon path={CHECK} size={28} strokeWidth={2.7} />
      </div>
      <div className={r.emptyTitle}>Nada por leer</div>
      <div className={r.emptyBody}>
        {tab === 'dueno'
          ? `${dueno} no te ha escrito nada nuevo.`
          : 'Tu caja no tiene avisos del sistema.'}
      </div>
    </div>
  );
}
