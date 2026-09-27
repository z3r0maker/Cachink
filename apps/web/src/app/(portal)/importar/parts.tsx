'use client';

import { useState, type ReactNode } from 'react';

import type { TemplateId } from '@/server/import/templates';

import { Encabezado } from '../_primeros/encabezado';
import * as p from '../_primeros/primeros.css';
import { PasoArchivo } from './paso-archivo';
import { TEMPLATES } from './plantillas';
import { Plantillas } from './plantillas-ui';
import * as s from './importar.css';

/**
 * «Importar» (N-16, `CfgImportar.dc.html`): pick a template, drop the file,
 * review row by row, import. «Hazlo por mí» (N-18) rides in the aside.
 * `inicial` preselects a template; bare, the screen starts on Productos.
 */
export function ImportarScreen({
  inicial,
  aside,
}: {
  readonly inicial: TemplateId | null;
  readonly aside?: ReactNode;
}) {
  const [plantilla, setPlantilla] = useState<TemplateId>(inicial ?? 'productos');
  const meta = TEMPLATES.find((t) => t.id === plantilla) ?? TEMPLATES[0];
  return (
    <>
      <Encabezado
        aqui="Importar"
        titulo="Importar"
        subtitulo="Trae tus datos desde Excel o CSV. Los revisas antes de que se guarde nada."
      />
      <div className={p.dosColumnas}>
        <div className={p.columna}>
          <section className={s.paso} aria-labelledby="paso1">
            <h2 id="paso1" className={p.eyebrow}>
              1 · ¿Qué vas a traer?
            </h2>
            <Plantillas value={plantilla} onPick={setPlantilla} />
          </section>
          {meta !== undefined ? <PasoArchivo key={meta.id} meta={meta} /> : null}
        </div>
        {aside}
      </div>
    </>
  );
}
