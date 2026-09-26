'use client';

import Link from 'next/link';
import { useState } from 'react';

import { TEMAS, type Pregunta, type TemaId } from './contenido';
import { cuantos } from './buscar';
import type { Guia } from './guias';
import * as s from './ayuda.css';

/** The six topics; one tap narrows everything below to it, a second clears it. */
export function Temas(p: {
  readonly tema: TemaId | null;
  readonly onTema: (t: TemaId | null) => void;
}) {
  return (
    <section aria-labelledby="ayuda-temas">
      <h2 id="ayuda-temas" className={s.titulo}>
        Temas
      </h2>
      <div className={s.temas}>
        {TEMAS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={s.tema}
            aria-pressed={p.tema === t.id}
            onClick={() => p.onTema(p.tema === t.id ? null : t.id)}
          >
            <span className={s.temaLabel}>{t.label}</span>
            <span className={s.temaCuenta}>
              {cuantos(t.id)} {cuantos(t.id) === 1 ? 'respuesta' : 'respuestas'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Quick answers, one open at a time; each points at the screen it is about. */
export function Preguntas({ preguntas }: { readonly preguntas: readonly Pregunta[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  return (
    <section aria-labelledby="ayuda-preguntas">
      <h2 id="ayuda-preguntas" className={s.titulo}>
        Preguntas rápidas
      </h2>
      {preguntas.length === 0 ? (
        <p className={s.nada}>No encontré eso. Escríbenos abajo y te echamos la mano.</p>
      ) : (
        <div className={s.lista}>
          {preguntas.map((p) => (
            <div key={p.q} className={s.pregunta} data-abierta={abierta === p.q}>
              <button
                type="button"
                className={s.preguntaBoton}
                aria-expanded={abierta === p.q}
                onClick={() => setAbierta(abierta === p.q ? null : p.q)}
              >
                {p.q}
                <span aria-hidden="true">{abierta === p.q ? '−' : '+'}</span>
              </button>
              {abierta === p.q ? (
                <div className={s.respuesta}>
                  <p>{p.a}</p>
                  {p.ir ? <Link href={p.ir.href}>{p.ir.label} →</Link> : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Don Cuentas's guides: each opens beside the page, a step at a time. */
export function Guias(p: { readonly guias: readonly Guia[]; readonly onAbrir: (g: Guia) => void }) {
  if (p.guias.length === 0) return null;
  return (
    <section aria-labelledby="ayuda-guias" className={s.caja}>
      <h2 id="ayuda-guias" className={s.titulo}>
        Guías con Don Cuentas
      </h2>
      {p.guias.map((g) => (
        <button key={g.id} type="button" className={s.guia} onClick={() => p.onAbrir(g)}>
          <span className={s.temaLabel}>{g.titulo}</span>
          <span className={s.temaCuenta}>
            {g.minutos} min · {g.pasos.length} pasos
          </span>
        </button>
      ))}
    </section>
  );
}
