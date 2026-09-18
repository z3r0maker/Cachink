'use client';

import type { FilaPreferencia } from '@xangarro/domain';
import { useMemo, useState } from 'react';

import { Card, FilterChip, ScreenBody, SegmentedTabs } from '@/components';
import type { AvisosData } from '@/server/screens';
import { resolveScreenState } from '@/session/gating';

import { ConfigurarCard } from './configurar';
import { NoticeLine } from './parts';
import { MarcarLeidosButton } from './marcar-leidos';
import { pageSubtitle, pageTitle } from './avisos.css';

function Heading({ isConfigurar }: { readonly isConfigurar: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Avisos</h1>
        <p className={pageSubtitle}>Lo que necesita tu atención, y cómo quieres enterarte</p>
      </div>
      {!isConfigurar ? (
        <div style={{ marginLeft: 'auto' }}>
          <MarcarLeidosButton />
        </div>
      ) : null}
    </div>
  );
}

interface ControlsProps {
  readonly tab: string;
  readonly setTab: (v: string) => void;
  readonly all: AvisosData;
  readonly unread: number;
  readonly onlyUnread: boolean;
  readonly setOnlyUnread: (v: boolean) => void;
  readonly isConfigurar: boolean;
}

function Controls(p: ControlsProps) {
  return (
    <>
      <SegmentedTabs
        ariaLabel="Avisos"
        value={p.tab}
        onValueChange={p.setTab}
        tabs={[
          {
            value: 'operacion',
            label: 'Operación',
            count: p.all.filter((n) => n.source === 'operacion').length,
          },
          {
            value: 'sistema',
            label: 'Sistema',
            count: p.all.filter((n) => n.source === 'sistema').length,
          },
          { value: 'configurar', label: 'Configurar' },
        ]}
      />

      {!p.isConfigurar ? (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <FilterChip
            label="Todas"
            selected={!p.onlyUnread}
            onSelect={() => p.setOnlyUnread(false)}
          />
          <FilterChip
            label={`Sin leer (${p.unread})`}
            selected={p.onlyUnread}
            onSelect={() => p.setOnlyUnread(true)}
          />
        </div>
      ) : null}
    </>
  );
}

function Inbox(props: {
  readonly rows: AvisosData | null;
  readonly visible: NonNullable<AvisosData>;
}) {
  return (
    <ScreenBody
      state={resolveScreenState({
        error: props.rows === null,
        isEmpty: props.visible.length === 0,
      })}
      onRetry={() => window.location.reload()}
      empty={{ title: 'Sin avisos', body: 'Cuando algo requiera tu atención, aparecerá aquí.' }}
    >
      <Card>
        {props.visible.map((n) => (
          <NoticeLine key={n.id} n={n} />
        ))}
      </Card>
    </ScreenBody>
  );
}

export function AvisosScreen({
  rows,
  preferencias,
}: {
  readonly rows: AvisosData | null;
  /** The member's delivery matrix, already resolved by the domain. */
  readonly preferencias: readonly FilaPreferencia[];
}) {
  const [tab, setTab] = useState('operacion');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const all = rows ?? [];
  const isConfigurar = tab === 'configurar';

  const visible = useMemo(
    () => all.filter((n) => n.source === tab && (!onlyUnread || n.state === 'nuevo')),
    [all, tab, onlyUnread],
  );

  // The bell excludes Asesor rows (ADR-060); so does this counter.
  const unread = all.filter((n) => n.source !== 'asesor' && n.state === 'nuevo').length;

  return (
    <>
      <Heading isConfigurar={isConfigurar} />

      <Controls
        tab={tab}
        setTab={setTab}
        all={all}
        unread={unread}
        onlyUnread={onlyUnread}
        setOnlyUnread={setOnlyUnread}
        isConfigurar={isConfigurar}
      />
      {isConfigurar ? (
        <ConfigurarCard inicial={preferencias} />
      ) : (
        <Inbox rows={rows} visible={visible} />
      )}
    </>
  );
}
