'use client';

import Link from 'next/link';
import { useState } from 'react';

import { parseClientSheet } from '@/lib/import-clientes';

import { Aviso, type AvisoTono } from '../_primeros/aviso';
import { dinero } from '../_primeros/formato';
import * as p from '../_primeros/primeros.css';
import { BotonCsv, PieLineas } from './pie-lineas';
import { TablaLineas } from './tabla-lineas';
import { lineaDe, type ClienteOpcion } from './use-saldos';
import * as s from './cxc.css';

/** One CxC line while the owner edits it; `clienteId` is '' until a cliente is chosen. */
export interface Linea {
  readonly clave: string;
  readonly clienteId: string;
  readonly nombre: string;
  readonly telefono: string;
  readonly saldo: string;
}

/**
 * The CxC lines (N-17): hand-edited, or prefilled from a .csv shaped like the
 * Clientes import plus a saldo column (nombre, teléfono, saldo). A row whose
 * cliente does not exist is reported, never silently created.
 */
async function prellenarLineas(
  file: File,
  clientes: readonly ClienteOpcion[],
): Promise<{ lineas: Linea[]; sinMatch: string[] }> {
  const { parseCsv } = await import('@/lib/csv');
  const porNombre = new Map(clientes.map((c) => [c.nombre.trim().toLowerCase(), c]));
  const tabla = parseCsv(await file.text());
  const parsed = parseClientSheet(tabla);
  if (!parsed.ok) throw new Error(parsed.message);
  const nuevas: Linea[] = [];
  const sinMatch: string[] = [];
  for (const row of parsed.rows) {
    if (row.values === null) continue;
    const v = row.values as { nombre: string };
    const match = porNombre.get(v.nombre.trim().toLowerCase());
    if (match === undefined) {
      sinMatch.push(v.nombre);
      continue;
    }
    const celda = tabla[row.line - 1] as readonly unknown[] | undefined;
    nuevas.push(lineaDe(match, match.id, String(celda?.[2] ?? '').trim()));
  }
  return { lineas: nuevas, sinMatch };
}

/** The file's lines replace the same cliente's line; the rest stay. */
function mezclar(actuales: readonly Linea[], nuevas: readonly Linea[]): Linea[] {
  const ids = new Set(nuevas.map((l) => l.clienteId));
  return [...actuales.filter((l) => l.clienteId !== '' && !ids.has(l.clienteId)), ...nuevas];
}

function textoPrellenado(n: number, sinMatch: readonly string[]): string {
  const base = `Prellené ${n} ${n === 1 ? 'saldo' : 'saldos'}.`;
  if (sinMatch.length === 0) return `${base} Revísalos antes de guardar.`;
  const lista = sinMatch.slice(0, 3).join(', ') + (sinMatch.length > 3 ? '…' : '');
  return `${base} ${sinMatch.length} sin match: ${lista} no ${sinMatch.length === 1 ? 'está' : 'están'} en tus clientes.`;
}

export interface LineasProps {
  readonly lineas: readonly Linea[];
  readonly setLineas: (fn: (ls: Linea[]) => Linea[]) => void;
  readonly editable: boolean;
  readonly clientes: readonly ClienteOpcion[];
  readonly cxc: bigint;
}

export function LineasCxC(props: LineasProps) {
  const [aviso, setAviso] = useState<AvisoCsvEstado | null>(null);
  const prellenar = async (file: File | null) => {
    if (file === null) return;
    try {
      const r = await prellenarLineas(file, props.clientes);
      props.setLineas((ls) => mezclar(ls, r.lineas));
      const hay = r.sinMatch.length > 0;
      setAviso({
        tono: hay ? 'warning' : 'success',
        texto: textoPrellenado(r.lineas.length, r.sinMatch),
        sinMatch: hay,
      });
    } catch (error) {
      setAviso({ tono: 'critical', texto: (error as Error).message, sinMatch: false });
    }
  };
  return (
    <section className={p.panel} aria-labelledby="cxc-t">
      <Cabeza editable={props.editable} onArchivo={(f) => void prellenar(f)} />
      {aviso !== null && props.editable ? (
        <AvisoCsv aviso={aviso} onCerrar={() => setAviso(null)} />
      ) : null}
      <TablaLineas {...props} />
      <PieLineas {...props} total={dinero(props.cxc)} />
    </section>
  );
}

type AvisoCsvEstado = { tono: AvisoTono; texto: string; sinMatch: boolean };

function AvisoCsv({
  aviso,
  onCerrar,
}: {
  readonly aviso: AvisoCsvEstado;
  readonly onCerrar: () => void;
}) {
  return (
    <div className={s.aviso}>
      <Aviso
        tono={aviso.tono}
        onCerrar={onCerrar}
        accion={
          aviso.sinMatch ? (
            <Link href="/importar?plantilla=clientes">Impórtalos primero</Link>
          ) : undefined
        }
      >
        {aviso.texto}
      </Aviso>
    </div>
  );
}

function Cabeza({
  editable,
  onArchivo,
}: {
  readonly editable: boolean;
  readonly onArchivo: (f: File | null) => void;
}) {
  return (
    <div className={s.cabeza}>
      <div className={s.cabezaTexto}>
        <h2 id="cxc-t" className={s.titulo}>
          Cuentas por cobrar iniciales
        </h2>
        <span className={p.nota}>
          Lo que tus clientes te debían ese día. Columnas del CSV: nombre, teléfono, saldo.
        </span>
      </div>
      {editable ? <BotonCsv onArchivo={onArchivo} /> : null}
    </div>
  );
}
