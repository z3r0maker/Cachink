'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Button, ScreenBody, SegmentedTabs, ExportButton } from '@/components';
import { button } from '@/components/button.css';
import { useSession } from '@/session/provider';
import type { EstadosModel } from '@/server/estados';
import { hasStatements, resolveScreenState } from '@/session/gating';

import { activoLines, flujoLines, pasivoLines, resultadosLines } from './lines';
import { IsrNotice, Resumen } from './parts';
import { Indicadores } from './indicadores';
import { FlujoCard } from './flujo-card';
import { pageSubtitle, pageTitle, resultadosGrid } from './estados.css';
import type { Periodo } from './periodo';
import { PeriodoSwitcher } from './periodo-switcher';
import { Donuts, Waterfall } from './charts';
import { LadoResultados } from './lado';
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
      <IsrNotice isrTasa={m.isrTasa} isr={ER.isr} regimenSat={m.regimenSat} />
      <div className={resultadosGrid}>
        <Waterfall er={ER} mermas={m.mermas} />
        <LadoResultados er={ER} />
      </div>
      <Statement title="Estado de Resultados (NIF B-3)" lines={resultadosLines(ER, m.desglose)} />
      <Donuts desglose={m.desglose} />
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
      <FlujoCard flujo={FLUJO} />
      <Statement title="Flujo de Efectivo (NIF B-2)" lines={flujoLines(FLUJO)} />
    </>
  );
}

function Heading({
  mayInforme,
  mes,
}: {
  /** `capabilities.informeMensual` — Xangarro and above (ADR-090); below it
   *  the button is hidden (the Suscripción cards carry the upsell, not this
   *  header). */
  readonly mayInforme: boolean;
  /** The period's month, `YYYY-MM` — the informe is monthly by definition. */
  readonly mes: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Estados financieros</h1>
        <p className={pageSubtitle}>Tus números en el formato que tu contador espera</p>
      </div>
      {/* Wraps like its parent: four actions are 693 px on one line, which
          scrolled the page sideways at 768 (`a11y.spec.ts`). */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {/* Export is open to every plan and every role, including the contador. */}
        {/* The statements are computed; what is exportable is the ledger
            they are computed from, which is what the contador actually wants. */}
        <ExportButton dataset="ventas" label="Exportar ventas" />
        <ExportButton dataset="gastos" label="Exportar gastos" />
        {/* Prints the statement for the chosen period; the app chrome drops out (P-34). */}
        <Button variant="secondary" onClick={() => window.print()}>
          Imprimir
        </Button>
        {/* The contador's PDF — the same document the phone renders (P-34). */}
        {mayInforme ? (
          <a
            className={button({ variant: 'secondary' })}
            href={`/api/export/informe-mensual?mes=${mes}`}
            data-no-print
          >
            Informe mensual
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Tab({ tab, m }: { readonly tab: string; readonly m: EstadosModel }) {
  if (tab === 'posicion') return <Posicion m={m} />;
  if (tab === 'flujo') return <Flujo m={m} />;
  if (tab === 'indicadores') return <Indicadores indicadores={m.indicadores} />;
  return <Resultados m={m} />;
}

/** The content area: plan entitlement, load failure and the tab's statement. */
function Statements({
  maySeeStatements,
  model,
  tab,
}: {
  readonly maySeeStatements: boolean;
  readonly model: EstadosModel | null;
  readonly tab: string;
}) {
  return (
    <ScreenBody
      state={resolveScreenState({
        entitled: maySeeStatements,
        error: model === null,
        // Posición is a snapshot, not a window: an empty period can still
        // stand on a real opening balance, so it keeps rendering (S-2).
        isEmpty: model?.vacio === true && tab !== 'posicion',
      })}
      onRetry={() => window.location.reload()}
      empty={{
        title: 'Sin datos en el periodo',
        body: 'No registraste ventas ni gastos en esta ventana de tiempo. Cambia el periodo arriba o captura un movimiento.',
      }}
      locked={{
        title: 'Los estados financieros llegan con Xangarro',
        body: 'Tu plan Xangarrito registra ventas y gastos. Los estados NIF — resultados, balance y flujo — vienen incluidos desde Xangarro.',
        plan: 'Xangarro',
      }}
    >
      {model === null ? null : <Tab tab={tab} m={model} />}
    </ScreenBody>
  );
}

export function EstadosScreen({
  model,
  periodo,
}: {
  readonly model: EstadosModel | null;
  readonly periodo: Periodo;
}) {
  const session = useSession();
  const [tab, setTab] = useState('resultados');

  return (
    <>
      <Heading
        mayInforme={session.capabilities.informeMensual}
        mes={periodo.rango.desde.slice(0, 7)}
      />
      <PeriodoSwitcher periodo={periodo} />
      <SegmentedTabs
        ariaLabel="Estados financieros"
        value={tab}
        onValueChange={setTab}
        tabs={TABS}
      />
      <Statements maySeeStatements={hasStatements(session.capabilities)} model={model} tab={tab} />
    </>
  );
}
