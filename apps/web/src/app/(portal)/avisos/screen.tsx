'use client';

import type { FilaPreferencia } from '@xangarro/domain';
import { useMemo, useState } from 'react';

import { Don, ScreenBody } from '@/components';
import type { AvisosData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';
import { useSession } from '@/session/provider';

import { barra, Palanca, Pestanas, Separador } from '../cortes/controles';
import * as s from './avisos.css';
import { ConfigurarCard } from './configurar';
import { MarcarLeidosButton } from './marcar-leidos';
import { AvisoTarjeta, type Aviso } from './tarjeta';
import { lista } from './tarjeta.css';

type Pestana = 'operacion' | 'sistema' | 'configurar';

function Heading(p: { readonly isConfigurar: boolean; readonly unread: number }) {
  return (
    <div className={s.cabeza}>
      <div className={s.titulos}>
        <h1 className={s.pageTitle}>Avisos</h1>
        <p className={s.pageSubtitle}>Lo que necesita tu atención, y cómo quieres enterarte.</p>
      </div>
      {p.isConfigurar ? null : <MarcarLeidosButton sinPendientes={p.unread === 0} />}
    </div>
  );
}

function Controls(p: {
  readonly tab: Pestana;
  readonly setTab: (v: Pestana) => void;
  readonly all: readonly Aviso[];
  readonly unread: number;
  readonly onlyUnread: boolean;
  readonly setOnlyUnread: (v: boolean) => void;
}) {
  const n = (src: string) => p.all.filter((a) => a.source === src).length;
  return (
    <div className={barra}>
      <Pestanas
        ariaLabel="Avisos"
        value={p.tab}
        onChange={p.setTab}
        tabs={[
          { value: 'operacion', label: 'Operación', count: n('operacion') },
          { value: 'sistema', label: 'Sistema', count: n('sistema') },
          { value: 'configurar', label: 'Configurar' },
        ]}
      />
      {p.tab === 'configurar' ? null : (
        <>
          <Separador />
          <Palanca label="Todas" on={!p.onlyUnread} onClick={() => p.setOnlyUnread(false)} />
          <Palanca
            label={`Sin leer (${p.unread})`}
            on={p.onlyUnread}
            onClick={() => p.setOnlyUnread(true)}
          />
        </>
      )}
    </div>
  );
}

/** Nothing to show: Don celebrates, and a filtered view offers the rest. */
function Vacio(p: { readonly onlyUnread: boolean; readonly verTodas: () => void }) {
  return (
    <div className={s.vacio}>
      <Don pose="celebrando" size={72} />
      <span className={s.vacioTexto}>
        <h2 className={s.vacioTitulo}>
          {p.onlyUnread ? 'Ya leíste todo' : 'Sin avisos por ahora'}
        </h2>
        <p className={s.vacioCuerpo}>
          Cuando algo necesite tu atención, aparece aquí y en la campanita de arriba.
        </p>
      </span>
      {p.onlyUnread ? <Palanca label="Ver todas" on={false} onClick={p.verTodas} /> : null}
    </div>
  );
}

function Inbox(p: {
  readonly mayWrite: boolean;
  readonly rows: AvisosData | null;
  readonly visible: readonly Aviso[];
  readonly onlyUnread: boolean;
  readonly verTodas: () => void;
}) {
  if (p.rows !== null && p.visible.length === 0) {
    return <Vacio onlyUnread={p.onlyUnread} verTodas={p.verTodas} />;
  }
  return (
    <ScreenBody
      state={resolveScreenState({ error: p.rows === null })}
      onRetry={() => window.location.reload()}
    >
      <section className={lista} aria-label="Lista de avisos">
        {p.visible.map((n) => (
          <AvisoTarjeta key={n.id} n={n} mayWrite={p.mayWrite} />
        ))}
      </section>
    </ScreenBody>
  );
}

/** The tab, the unread filter and what they leave visible. */
function useAvisos(rows: AvisosData | null) {
  const [tab, setTab] = useState<Pestana>('operacion');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const all = useMemo(() => rows ?? [], [rows]);
  const visible = useMemo(
    () => all.filter((n) => n.source === tab && (!onlyUnread || n.state === 'nuevo')),
    [all, tab, onlyUnread],
  );
  // The bell excludes Asesor rows (ADR-060); so does this counter.
  const unread = all.filter((n) => n.source !== 'asesor' && n.state === 'nuevo').length;
  return { tab, setTab, onlyUnread, setOnlyUnread, all, visible, unread };
}

/** Avisos (CfgAvisos): the inbox by source, and «Configurar», how you want to hear. */
export function AvisosScreen({
  rows,
  preferencias,
}: {
  readonly rows: AvisosData | null;
  /** The member's delivery matrix, already resolved by the domain. */
  readonly preferencias: readonly FilaPreferencia[];
}) {
  const { tab, setTab, onlyUnread, setOnlyUnread, all, visible, unread } = useAvisos(rows);
  const mayWrite = canWrite(useSession().role);
  const isConfigurar = tab === 'configurar';
  return (
    <>
      <Heading isConfigurar={isConfigurar} unread={unread} />
      <Controls
        tab={tab}
        setTab={setTab}
        all={all}
        unread={unread}
        onlyUnread={onlyUnread}
        setOnlyUnread={setOnlyUnread}
      />
      {isConfigurar ? (
        <ConfigurarCard inicial={preferencias} />
      ) : (
        <Inbox
          rows={rows}
          visible={visible}
          mayWrite={mayWrite}
          onlyUnread={onlyUnread}
          verTodas={() => setOnlyUnread(false)}
        />
      )}
    </>
  );
}
