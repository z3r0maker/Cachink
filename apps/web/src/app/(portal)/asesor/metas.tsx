'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Banner, Button, Card, Tag, Verdict } from '@/components';
import type { MetasPageData } from '@/server/metas';
import type { Role } from '@/session/types';
import { eyebrow } from '@/styles/text.css';

import { CelebracionMeta } from './celebracion';
import { CierreReciente } from './cierre';
import { Wizard } from './wizard';
import { capName, capReq, capRow, goalFigure } from './asesor.css';

const PACE: Readonly<
  Record<string, { readonly label: (d: number) => string; readonly tone: 'healthy' | 'warning' }>
> = {
  ahead: { label: (d) => `Vas ${d} ${d === 1 ? 'día' : 'días'} adelantado`, tone: 'healthy' },
  onpace: { label: () => 'Vas al ritmo', tone: 'healthy' },
  behind: { label: (d) => `Vas ${d} ${d === 1 ? 'día' : 'días'} atrasado`, tone: 'warning' },
};

function Trophies({ trophies }: { readonly trophies: MetasPageData['trophies'] }) {
  if (trophies.length === 0) return null;
  return (
    <Card>
      <div className={eyebrow}>Metas anteriores</div>
      {trophies.map((t) => (
        <div key={t.id} className={capRow}>
          <span style={{ minWidth: 0 }}>
            <span className={capName}>{t.periodo}</span>
            <span className={capReq}>
              {t.objetivo === 'vender'
                ? 'Vender más'
                : t.objetivo === 'ganar'
                  ? 'Ganar más'
                  : 'Gastar menos'}
            </span>
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(t.resultadoCentavos ?? 0n)}
            </strong>
            <Tag tone={t.lograda ? 'success' : 'neutral'}>
              {t.lograda ? 'Lograda' : 'No lograda'}
            </Tag>
          </span>
        </div>
      ))}
    </Card>
  );
}

const NOMBRE_OBJETIVO: Readonly<Record<string, string>> = {
  vender: 'Vender más',
  ganar: 'Ganar más',
  gastar: 'Gastar menos',
};

function ActiveGoal({
  data,
  onCambiar,
  mayCambiar,
}: {
  readonly data: MetasPageData;
  readonly onCambiar: () => void;
  readonly mayCambiar: boolean;
}) {
  const meta = data.meta!;
  const pace = PACE[data.ritmo?.ritmo ?? 'onpace'] ?? PACE.onpace!;
  const nombre = NOMBRE_OBJETIVO[meta.objetivo] ?? 'Vender más';
  const linea =
    data.ritmo?.faltante && data.ritmo.faltante > 0n
      ? `Te faltan ${formatMoney(data.ritmo.faltante)} para llegar.`
      : 'Ya llegaste a tu meta este mes. Sigue así para cerrarla con todo.';
  return (
    <>
      <Card tone="hero" emphasis="hero">
        <div className={eyebrow}>Tu meta de {meta.periodo}</div>
        <p className={goalFigure}>{formatMoney(meta.objetivoCentavos)}</p>
        <div style={{ fontWeight: 700 }}>{nombre}</div>
        <div style={{ marginTop: 10 }}>
          <Verdict onYellow tone={pace.tone}>
            {pace.label(data.ritmo?.dias ?? 0)}
          </Verdict>
        </div>
        <p style={{ margin: '12px 0 0', fontWeight: 600 }}>{linea}</p>
        {mayCambiar ? (
          <div style={{ marginTop: 18 }}>
            <Button variant="dark" onClick={onCambiar}>
              Cambiar de meta
            </Button>
          </div>
        ) : null}
      </Card>
      <Trophies trophies={data.trophies} />
    </>
  );
}

/** The achieved-goal branch: the takeover once, then the next step. */
function ConCelebracion({ data }: { readonly data: MetasPageData }) {
  return (
    <>
      <CelebracionMeta clave={data.celebrar!.clave} racha={data.celebrar!.racha} />
      <Banner
        tone="success"
        title="¡Lograste tu meta!"
        body="Recarga para elegir la meta de este mes."
      />
    </>
  );
}

/** A young business: no month to anchor a goal to yet. */
function NegocioNuevo() {
  return (
    <Card>
      <div className={eyebrow}>Tu primera meta</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>
        Aún no hay un mes que comparar
      </h3>
      <p style={{ margin: 0 }}>
        Las metas se anclan a tu mes anterior. Registra ventas y gastos este mes, y en cuanto
        termine tendrás una meta posible esperándote aquí.
      </p>
    </Card>
  );
}

/** Metas is deterministic arithmetic, so it ships live in production. */
export function Metas({
  data,
  role,
}: {
  readonly data: MetasPageData | null;
  readonly role: Role;
}) {
  if (data === null) {
    return (
      <Banner
        tone="critical"
        title="No pudimos leer tus metas"
        body="Tus metas están a salvo; refresca para volver a cargarlas."
      />
    );
  }
  const [editando, setEditando] = useState(false);
  const mayCambiar = role !== 'viewer';

  if (data.celebrar !== null && mayCambiar) {
    return <ConCelebracion data={data} />;
  }

  if (data.estado === 'negocio-nuevo') {
    return <NegocioNuevo />;
  }

  if (data.estado === 'cerrada' && data.recienCerrada !== null) {
    return <CierreReciente data={data} onCambiar={() => setEditando(true)} />;
  }

  if (editando || data.estado === 'sin-meta') {
    return mayCambiar ? (
      <Wizard niveles={data.niveles} onDone={() => setEditando(false)} />
    ) : (
      <Banner tone="info" title="Solo lectura" body="Tu cuenta no puede fijar metas." />
    );
  }

  return <ActiveGoal data={data} onCambiar={() => setEditando(true)} mayCambiar={mayCambiar} />;
}
