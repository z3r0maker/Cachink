'use client';

import { useState } from 'react';

import {
  Banner,
  Button,
  Card,
  DataTable,
  KpiCard,
  ScreenBody,
  StatusPill,
  kpiGrid,
  type ColumnDef,
} from '@/components';
import { SESSION } from '@/fixtures/business';
import type { SincronizacionData } from '@/server/screens';
import { isOwner, resolveScreenState } from '@/session/gating';

import { pageSubtitle, pageTitle } from './sincronizacion.css';

type Rejection = SincronizacionData['rechazos'][number];

/**
 * Human sentences, never codes.
 *
 * In production these come from the contract's `ERROR_CATALOG`; the mapping
 * lives in one place so a rejected row never shows a customer an identifier.
 */
const MOTIVO: Readonly<Record<string, string>> = {
  FK_PRODUCT_MISSING: 'El producto de este registro ya no existe en el portal.',
  FK_USER_MISSING: 'El operador de este registro ya no existe en el portal.',
  HYBRID_UPDATE_FORBIDDEN: 'Este tipo de registro solo se cambia en el portal.',
  VALIDATION: 'El registro tiene datos que el servidor no acepta.',
};

const preview = (payload: unknown): string => {
  const p = payload as { preview?: string } | null;
  return p?.preview ?? '—';
};

function Heading() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Sincronización</h1>
        <p className={pageSubtitle}>Qué falta por enviar</p>
      </div>
      {isOwner(SESSION.role) ? (
        <div style={{ marginLeft: 'auto' }}>
          <Button>Sincronizar ahora</Button>
        </div>
      ) : null}
    </div>
  );
}

function Resumen({
  rows,
  dispositivos,
}: {
  readonly rows: readonly Rejection[];
  readonly dispositivos: SincronizacionData['dispositivos'];
}) {
  return (
    <>
      <div className={kpiGrid}>
        <KpiCard
          label="Registros rechazados"
          value={`${rows.length}`}
          tone={rows.length > 0 ? 'warning' : 'neutral'}
          hint="Esperando revisión"
        />
        <KpiCard label="Dispositivos conectados" value={`${dispositivos.length}`} />
      </div>

      <div className={kpiGrid}>
        {dispositivos.map((d) => (
          <Card key={d.id}>
            <strong>{d.nombre}</strong>
            <div style={{ marginTop: 8 }}>
              <StatusPill tone="success">Al día</StatusPill>
            </div>
            <p style={{ marginTop: 10, color: 'var(--text-muted)' }}>
              Última sincronización: {d.lastPushAt ?? '—'}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Columns need the resolve handler, so they are built per render. */
const columns = (onResolve: (id: string) => void): readonly ColumnDef<Rejection>[] => [
  { key: 'tipo', header: 'Tipo de registro', render: (r) => r.tableName },
  { key: 'dispositivo', header: 'Dispositivo', render: (r) => r.deviceId },
  { key: 'motivo', header: 'Motivo', render: (r) => MOTIVO[r.code] ?? MOTIVO.VALIDATION },
  { key: 'preview', header: 'Vista previa', render: (r) => preview(r.payload) },
  {
    key: 'accion',
    header: '',
    render: (r) => (
      <Button size="sm" variant="secondary" onClick={() => onResolve(r.id)}>
        Marcar como resuelto
      </Button>
    ),
  },
];

export function SincronizacionScreen({ data }: { readonly data: SincronizacionData | null }) {
  const [resolved, setResolved] = useState<readonly string[]>([]);
  const rows = (data?.rechazos ?? []).filter((r) => !resolved.includes(r.id));
  const onResolve = (id: string) => setResolved([...resolved, id]);

  return (
    <>
      <Heading />

      {rows.length > 0 ? (
        <Banner
          tone="warning"
          title={`${rows.length} registros no se pudieron enviar.`}
          body="Siguen guardados en el dispositivo. Nada se pierde."
        />
      ) : null}

      <Resumen rows={rows} dispositivos={data?.dispositivos ?? []} />
      <ScreenBody
        state={resolveScreenState({ error: data === null, isEmpty: rows.length === 0 })}
        onRetry={() => window.location.reload()}
        empty={{
          title: 'Todo sincronizado',
          body: 'No hay registros pendientes. Tus números están completos.',
        }}
      >
        <DataTable
          caption="Registros no enviados"
          columns={columns(onResolve)}
          rows={rows}
          rowKey={(r) => r.id}
          minWidth={980}
          footer={<span>Mostrando {rows.length} registros rechazados</span>}
        />
      </ScreenBody>
    </>
  );
}
