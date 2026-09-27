'use client';

import Link from 'next/link';
import { colors } from '@xangarro/tokens';

import { Button, DataTable } from '@/components';
import { Toast } from '@/operador/ui/toast';
import { Icon } from '@/shell/icon';

import { columnas } from './columnas';
import { barra, Buscador, Palanca, Pestanas, Separador } from './controles';
import * as s from './cortes.css';
import { filtrar } from './derive';
import { exportarCortes } from './exportar';
import { Panel } from './panel';
import { Resumen } from './resumen';
import type { Corte, FiltroCortes } from './types';
import { useCortes, type Cortes } from './use-cortes';

const PESTANAS = ['Todos', 'Por aclarar', 'Con diferencia'] as const;
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
      <Resumen cortes={p.cortes} estado={x.estado} />
      <Filtros cortes={p.cortes} x={x} />
      <DataTable
        caption="Cortes de turno"
        columns={columnas(x.estado)}
        rows={filtrar(p.cortes, x.filtro, x.estado, x.query, x.caja)}
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
    <div className={s.cabeza}>
      <div className={s.titulos}>
        <nav aria-label="Ruta" className={s.miga}>
          <Link href="/equipo" className={s.enlace}>
            Equipo y nómina
          </Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Cortes</span>
        </nav>
        <h1 className={s.titulo}>Cortes de turno</h1>
        <p className={s.subtitulo}>
          Lo que cada quien contó al cerrar, contra lo que el sistema esperaba.
        </p>
      </div>
      <Button variant="secondary" onClick={onExportar}>
        <Icon path={DESCARGAR} size={18} strokeWidth={2.2} />
        Exportar mes
      </Button>
    </div>
  );
}

/** Todos / Por aclarar / Con diferencia with their counts, the cajas, and the search. */
function Filtros({ cortes, x }: { readonly cortes: readonly Corte[]; readonly x: Cortes }) {
  const cajas = [...new Set(cortes.map((c) => c.caja))].sort();
  const tabs = PESTANAS.map((f) => ({
    value: f,
    label: f,
    count: filtrar(cortes, f, x.estado, '').length,
  }));
  return (
    <div className={barra}>
      <Pestanas ariaLabel="Cortes por estado" tabs={tabs} value={x.filtro} onChange={x.setFiltro} />
      {cajas.length > 1 ? <Separador /> : null}
      {cajas.length > 1
        ? cajas.map((c) => (
            <Palanca key={c} label={c} on={x.caja === c} onClick={() => x.alternarCaja(c)} />
          ))
        : null}
      <Buscador
        label="Buscar corte"
        placeholder="Busca por persona o caja"
        value={x.query}
        onChange={x.setQuery}
      />
    </div>
  );
}

function SinCortes({ onClear }: { readonly onClear: () => void }) {
  return (
    <div className={s.vacio}>
      <h2 className={s.vacioTitulo}>Sin cortes que mostrar</h2>
      <p className={s.vacioTexto}>
        Ningún corte coincide con lo que filtraste. Quita un filtro o busca a otra persona.
      </p>
      <button type="button" className={s.vacioBoton} onClick={onClear}>
        Ver todos los cortes
      </button>
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
