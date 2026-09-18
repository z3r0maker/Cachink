'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Button, ScreenBody, SegmentedTabs } from '@/components';
import { useSession } from '@/session/provider';
import type { EstadosModel } from '@/server/estados';
import { hasStatements, resolveScreenState } from '@/session/gating';

import { activoLines, flujoLines, pasivoLines, resultadosLines } from './lines';
import { Indicadores, IsrNotice, Resumen } from './parts';
import { pageSubtitle, pageTitle } from './estados.css';
import { Statement } from './statement';

const TABS = [
  { value: 'resultados', label: 'Resultados' },
  { value: 'posicion', label: 'Posición' },
  { value: 'flujo', label: 'Flujo' },
  { value: 'indicadores', label: 'Indicadores' },
];

function Resultados({ m }: { readonly m: EstadosModel }) {
  const ER = m.resultados;
  const gastado = ER.costoDeVentas + ER.gastosOperativos;
  return (
    <>
      <Resumen
        headline={`Vendiste ${formatMoney(ER.ingresos)}, gastaste ${formatMoney(gastado)}, y te quedaron ${formatMoney(ER.utilidadNeta)}.`}
        figure={ER.utilidadNeta}
        label="Utilidad neta"
      />
      <IsrNotice />
      <Statement title="Estado de Resultados (NIF B-3)" lines={resultadosLines(ER)} />
    </>
  );
}

function Posicion({ m }: { readonly m: EstadosModel }) {
  const BALANCE = m.balance;
  return (
    <>
      <Resumen
        headline={`Tienes ${formatMoney(BALANCE.activo.total)} en activos. Tu patrimonio neto es ${formatMoney(BALANCE.capital.total)}.`}
        figure={BALANCE.capital.total}
        label="Total capital"
      />
      <Statement title="Balance (NIF B-6) · Activo" lines={activoLines(BALANCE)} />
      <Statement title="Pasivo y Capital" lines={pasivoLines(BALANCE)} />
    </>
  );
}

function Flujo({ m }: { readonly m: EstadosModel }) {
  const FLUJO = m.flujo;
  return (
    <>
      <Resumen
        headline={`Flujo neto del periodo: ${formatMoney(FLUJO.total)}.`}
        figure={FLUJO.total}
        label="Incremento neto en efectivo"
      />
      <Statement title="Flujo de Efectivo (NIF B-2)" lines={flujoLines(FLUJO)} />
    </>
  );
}

function Heading() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Estados financieros</h1>
        <p className={pageSubtitle}>Tus números en el formato que tu contador espera</p>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
        {/* Export is open to every plan and every role, including the contador. */}
        <Button variant="secondary">Exportar Excel</Button>
      </div>
    </div>
  );
}

export function EstadosScreen({ model }: { readonly model: EstadosModel | null }) {
  const session = useSession();
  const [tab, setTab] = useState('resultados');

  return (
    <>
      <Heading />
      <SegmentedTabs
        ariaLabel="Estados financieros"
        value={tab}
        onValueChange={setTab}
        tabs={TABS}
      />
      <ScreenBody
        state={resolveScreenState({
          entitled: hasStatements(session.capabilities),
          error: model === null,
        })}
        onRetry={() => window.location.reload()}
        empty={{
          title: 'Sin datos en el periodo',
          body: 'Registra movimientos en esta ventana de tiempo.',
        }}
        locked={{
          title: 'Los estados financieros llegan con Xangarro',
          body: 'Tu plan Xangarrito registra ventas y gastos. Los estados NIF — resultados, balance y flujo — vienen incluidos desde Xangarro.',
          plan: 'Xangarro',
        }}
      >
        {model === null ? null : (
          <>
            {tab === 'resultados' ? <Resultados m={model} /> : null}
            {tab === 'posicion' ? <Posicion m={model} /> : null}
            {tab === 'flujo' ? <Flujo m={model} /> : null}
            {tab === 'indicadores' ? <Indicadores indicadores={model.indicadores} /> : null}
          </>
        )}
      </ScreenBody>
    </>
  );
}
