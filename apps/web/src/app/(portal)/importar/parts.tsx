'use client';

import { useState } from 'react';

import { Button, OptionCards, type OptionDef } from '@/components';
import type { TemplateId } from '@/server/import/templates';

import { Revision } from './revision';
import { useImportar, type Step } from './use-importar';
import { pageSubtitle, pageTitle } from '../productos/productos.css';

/**
 * «Importar» (N-16): pick a template, then P-07's three steps — template →
 * revisión → importación — for whichever sheet the business is bringing over.
 * Saldos iniciales (N-17) and «Hazlo por mí» (N-18) join these cards later.
 */

interface TemplateMeta {
  readonly id: TemplateId;
  readonly label: string;
  readonly description: string;
  readonly intro: string;
  readonly templateHref: string;
}

const TEMPLATES: readonly TemplateMeta[] = [
  {
    id: 'productos',
    label: 'Productos',
    description: 'Tu catálogo: nombre, precios, categoría. Sin existencias (ADR-081).',
    intro:
      'Descarga la plantilla, llénala y súbela. Los productos empiezan en cero existencias; súmalas después con un movimiento.',
    templateHref: '/api/import/productos',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Nombre, teléfono y RFC opcional. Llega a tus cajas al sincronizar.',
    intro:
      'Descarga la plantilla, llénala y súbela. Si un cliente ya existe (mismo teléfono o nombre), sus datos se actualizan.',
    templateHref: '/api/import/clientes',
  },
];

function Archivo({
  meta,
  onFile,
}: {
  readonly meta: TemplateMeta;
  readonly onFile: (f: File | null) => void;
}) {
  return (
    <>
      <p>{meta.intro}</p>
      <a href={meta.templateHref} download>
        Descargar plantilla
      </a>
      <input
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        aria-label={`Archivo de ${meta.label.toLowerCase()}`}
        data-testid="import-archivo"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </>
  );
}

function Listo({ step }: { readonly step: Extract<Step, { name: 'listo' }> }) {
  const r = step.result;
  return (
    <p data-testid="import-listo">
      Listo: {r.nuevos} nuevos, {r.actualizados} actualizados, {r.sinCambios} sin cambios,{' '}
      {r.omitidos} con error. Llegan a tus cajas en su siguiente sincronización.
    </p>
  );
}

function Primaria({
  meta,
  f,
}: {
  readonly meta: TemplateMeta;
  readonly f: ReturnType<typeof useImportar>;
}) {
  const n =
    f.step.name === 'revision'
      ? f.step.rows.filter((r) => r.kind === 'nuevo' || r.kind === 'actualizar').length
      : 0;
  if (f.step.name === 'listo') return null;
  const revisando = f.step.name === 'revision';
  return (
    <Button
      variant="primary"
      disabled={f.pending || (revisando && n === 0)}
      onClick={revisando ? f.importar : f.revisar}
    >
      {f.pending
        ? 'Procesando…'
        : revisando
          ? `Importar ${n} ${meta.label.toLowerCase()}`
          : 'Revisar archivo'}
    </Button>
  );
}

function Acciones({
  meta,
  f,
  onCambiar,
}: {
  readonly meta: TemplateMeta;
  readonly f: ReturnType<typeof useImportar>;
  readonly onCambiar: () => void;
}) {
  return (
    <div
      style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}
    >
      <Button variant="secondary" onClick={f.step.name === 'listo' ? f.reset : onCambiar}>
        {f.step.name === 'listo' ? 'Importar otro archivo' : 'Cambiar de plantilla'}
      </Button>
      <Primaria meta={meta} f={f} />
      {f.error !== null ? <span role="alert">{f.error}</span> : null}
    </div>
  );
}

/** The chosen template's three-step flow; the picker is one «Cambiar» away. */
function PlantillaElegida({
  meta,
  onCambiar,
}: {
  readonly meta: TemplateMeta;
  readonly onCambiar: () => void;
}) {
  const f = useImportar(meta.id);
  const entidad = meta.label.toLowerCase();
  return (
    <>
      <h1 className={pageTitle}>Importar {entidad}</h1>
      <p className={pageSubtitle}>{meta.description}</p>
      {f.step.name === 'archivo' ? <Archivo meta={meta} onFile={f.setFile} /> : null}
      {f.step.name === 'revision' ? <Revision rows={f.step.rows} entidad={entidad} /> : null}
      {f.step.name === 'listo' ? <Listo step={f.step} /> : null}
      <Acciones meta={meta} f={f} onCambiar={onCambiar} />
    </>
  );
}

function ElegirPlantilla({ onPick }: { readonly onPick: (id: TemplateId) => void }) {
  const options: readonly OptionDef[] = TEMPLATES.map((t) => ({
    value: t.id,
    title: t.label,
    description: t.description,
  }));
  return (
    <>
      <h1 className={pageTitle}>Importar</h1>
      <p className={pageSubtitle}>
        Trae tus datos desde Excel o CSV, con revisión antes de escribir
      </p>
      <OptionCards
        ariaLabel="Qué quieres importar"
        options={options}
        value=""
        onValueChange={(v) => onPick(v as TemplateId)}
      />
    </>
  );
}

export function ImportarScreen({ inicial }: { readonly inicial: TemplateId | null }) {
  const [plantilla, setPlantilla] = useState<TemplateId | null>(inicial);
  const meta = TEMPLATES.find((t) => t.id === plantilla);
  if (meta === undefined) return <ElegirPlantilla onPick={setPlantilla} />;
  return <PlantillaElegida meta={meta} onCambiar={() => setPlantilla(null)} />;
}
