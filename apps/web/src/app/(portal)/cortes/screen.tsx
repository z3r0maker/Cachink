'use client';

import Link from 'next/link';
import { colors, portalFontSizes } from '@xangarro/tokens';

import {
  Button,
  DataTable,
  EmptyState,
  FilterChip,
  KpiCard,
  kpiGrid,
  SegmentedTabs,
} from '@/components';
import { SearchBox } from '@/operador/ui/filters';
import { Toast } from '@/operador/ui/toast';
import { Icon } from '@/shell/icon';

import { columnas } from './columnas';
import * as s from './cortes.css';
import { filtrar, netoTexto, resumen } from './derive';
import { exportarCortes } from './exportar';
import { Panel } from './panel';
import type { Corte, FiltroCortes } from './types';
import { useCortes, type Cortes } from './use-cortes';

const PESTANAS = ['Todos', 'Por aclarar', 'Con diferencia'] as const;
const CAJAS = ['Caja 1', 'Caja 2'] as const;
const DESCARGAR = 'M12 3v12M7 11l5 5 5-5M4 20h16';

/** Dueño · Cortes de turno: what each operator counted at close against what the system expected. */
export function CortesScreen(p: {
  readonly cortes: readonly Corte[];
  readonly filtro: FiltroCortes;
}) {
  const x = useCortes(p.cortes, p.filtro);
  return (
    <>
      <Encabezado onExportar={() => exportarCortes(p.cortes, x.estado)} />
      <Pestanas cortes={p.cortes} x={x} />
      <Kpis cortes={p.cortes} x={x} />
      <Filtros x={x} />
      <DataTable
        caption="Cortes de turno"
        columns={columnas(x.estado)}
        rows={filtrar(p.cortes, x.filtro, x.estado, x.query)}
        rowKey={(c) => c.id}
        onRowClick={(c) => x.setSel(c.id)}
        empty={<SinCortes onClear={x.limpiar} />}
      />
      <Capas x={x} />
    </>
  );
}

function Encabezado({ onExportar }: { readonly onExportar: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div className={s.miga}>
          <Link href="/equipo?tab=operadores" className={s.enlace}>
            Tu equipo
          </Link>{' '}
          · Cortes
        </div>
        <h1 className={s.titulo}>Cortes de turno</h1>
        <div className={s.subtitulo}>
          Lo que cada quien contó al cerrar, contra lo que el sistema esperaba.
        </div>
      </div>
      <Button variant="secondary" onClick={onExportar}>
        <Icon path={DESCARGAR} size={17} strokeWidth={2.2} />
        Exportar mes
      </Button>
    </div>
  );
}

function Kpis({ cortes, x }: { readonly cortes: readonly Corte[]; readonly x: Cortes }) {
  const r = resumen(cortes, x.estado);
  return (
    <div className={kpiGrid}>
      <KpiCard label="Cortes del mes" value={String(r.cortes)} hint={r.equipo} />
      <KpiCard
        label="Por aclarar"
        value={String(r.porAclarar)}
        tone={r.porAclarar > 0 ? 'warning' : 'positive'}
        hint="Esperan tu revisión"
      />
      <KpiCard
        label="Diferencia acumulada"
        value={netoTexto(r.neto)}
        tone={r.neto < 0n ? 'negative' : 'neutral'}
        hint="Suma de faltantes y sobrantes del mes"
      />
      <KpiCard
        label="Cortes que cuadraron"
        value={`${r.cuadraron} de ${r.cortes}`}
        tone="positive"
        hint="Sin diferencia alguna"
      />
    </div>
  );
}

/** Todos / Por aclarar / Con diferencia, with their counts. */
function Pestanas({ cortes, x }: { readonly cortes: readonly Corte[]; readonly x: Cortes }) {
  const tabs = PESTANAS.map((f) => ({
    value: f,
    label: f,
    count: filtrar(cortes, f, x.estado, '').length,
  }));
  return (
    <SegmentedTabs
      tabs={tabs}
      value={x.filtro}
      onValueChange={(v) => x.setFiltro(PESTANAS.find((f) => f === v) ?? 'Todos')}
      ariaLabel="Cortes por estado"
    />
  );
}

function SinCortes({ onClear }: { readonly onClear: () => void }) {
  return (
    <EmptyState
      inset
      glyph={<span style={{ fontSize: portalFontSizes.xl6 }}>📭</span>}
      title="Sin cortes que mostrar"
      body="Ningún corte coincide con lo que estás filtrando. Quita un filtro o busca por otro operador."
      action={{ label: 'Ver todos los cortes', onClick: onClear }}
    />
  );
}

function Filtros({ x }: { readonly x: Cortes }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CAJAS.map((f) => (
          <FilterChip key={f} label={f} selected={x.filtro === f} onSelect={() => x.setFiltro(f)} />
        ))}
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <SearchBox
          label="Buscar corte"
          placeholder="Buscar por operador o caja"
          value={x.query}
          onChange={x.setQuery}
        />
      </div>
    </div>
  );
}

/** The side panel of the open corte and the last toast. */
function Capas({ x }: { readonly x: Cortes }) {
  return (
    <>
      <Panel
        c={x.abierto}
        estado={x.abierto ? x.estado(x.abierto) : 'Cuadró'}
        onClose={() => x.setSel(null)}
        onPedir={x.pedir}
        onAclarar={x.aclarar}
      />
      {x.aviso ? (
        <Toast
          title={x.aviso.title}
          body={x.aviso.body}
          tint={x.aviso.tint}
          check={colors.black}
          width={380}
          onClose={x.cerrarAviso}
        />
      ) : null}
    </>
  );
}
