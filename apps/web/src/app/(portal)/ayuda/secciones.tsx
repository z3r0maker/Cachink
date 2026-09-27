'use client';

import Link from 'next/link';
import { useState } from 'react';

import { button } from '@/components/button.css';

import { TEMAS, type Pregunta, type TemaId } from './contenido';
import type { Guia } from './guias';
import * as s from './ayuda.css';
import * as c from './temas.css';

/** How many answers show before «Ver todas», when nothing narrows the list. */
const PRIMERAS = 5;

/** One row of topic chips over the answers; «Todas» clears the topic. */
export function Temas(p: {
  readonly tema: TemaId | null;
  readonly onTema: (t: TemaId | null) => void;
}) {
  return (
    <div className={s.temas} role="group" aria-label="Temas">
      <button
        type="button"
        className={c.temaChip}
        aria-pressed={p.tema === null}
        onClick={() => p.onTema(null)}
      >
        Todas
      </button>
      {TEMAS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={c.temaChip}
          aria-pressed={p.tema === t.id}
          onClick={() => p.onTema(p.tema === t.id ? null : t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** The answers: the most asked first; a search or a topic shows every match. */
export function Preguntas(p: {
  readonly preguntas: readonly Pregunta[];
  readonly acotado: boolean;
  readonly titulo: string;
}) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [todas, setTodas] = useState(false);
  const corto = !p.acotado && !todas && p.preguntas.length > PRIMERAS;
  const lista = corto ? p.preguntas.slice(0, PRIMERAS) : p.preguntas;
  return (
    <section aria-labelledby="ayuda-preguntas" className={s.seccion}>
      <h2 id="ayuda-preguntas" className={s.titulo}>
        {p.titulo}
      </h2>
      {lista.length === 0 ? (
        <p className={s.nada}>No encontré eso. Escríbele al equipo y te echamos la mano.</p>
      ) : (
        <div className={s.lista}>
          {lista.map((q) => (
            <Respuesta
              key={q.q}
              p={q}
              abierta={abierta === q.q}
              onToggle={() => setAbierta(abierta === q.q ? null : q.q)}
            />
          ))}
        </div>
      )}
      {corto ? (
        <button type="button" className={c.verTodas} onClick={() => setTodas(true)}>
          Ver las {p.preguntas.length} preguntas
        </button>
      ) : null}
    </section>
  );
}

function Respuesta(p: {
  readonly p: Pregunta;
  readonly abierta: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <div className={s.pregunta} data-abierta={p.abierta}>
      <button
        type="button"
        className={s.preguntaBoton}
        aria-expanded={p.abierta}
        onClick={p.onToggle}
      >
        {p.p.q}
        <span aria-hidden="true">{p.abierta ? '−' : '+'}</span>
      </button>
      {p.abierta ? (
        <div className={s.respuesta}>
          <p>{p.p.a}</p>
          {p.p.ir ? (
            <Link href={p.p.ir.href} className={button({ variant: 'secondary', size: 'sm' })}>
              {p.p.ir.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Don Cuentas's guides: each opens beside the page, a step at a time. */
export function Guias(p: { readonly guias: readonly Guia[]; readonly onAbrir: (g: Guia) => void }) {
  if (p.guias.length === 0) return null;
  return (
    <section aria-labelledby="ayuda-guias" className={s.caja}>
      <h2 id="ayuda-guias" className={s.titulo}>
        Guías paso a paso
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
