'use client';

import { TEMAS, buscar, type Guia, type TemaId } from '@xangarro/guias';
import { useState } from 'react';

import Link from 'next/link';

import { Don } from '@/components';
import { button } from '@/components/button.css';

import * as s from './ayuda.css';
import { GuiaDrawer } from './guia-drawer';
import { Guias, Preguntas, Temas } from './secciones';

const MAS_BUSCADO = ['corte', 'conectar caja', 'no enviados', 'factura'];

/** Don Cuentas, the question, and the search that narrows everything below. */
function Portada(p: { readonly texto: string; readonly onTexto: (t: string) => void }) {
  return (
    <section className={s.portada}>
      <Don pose="ayuda" size={150} />
      <div className={s.portadaTexto}>
        <h1 className={s.h1}>¿En qué te echo la mano?</h1>
        <input
          type="search"
          className={s.busca}
          aria-label="Busca tu duda"
          placeholder="Escribe tu duda: corte, conectar una caja, factura…"
          value={p.texto}
          onChange={(e) => p.onTexto(e.target.value)}
        />
        <div className={s.chips}>
          <span>Lo más buscado:</span>
          {MAS_BUSCADO.map((m) => (
            <button key={m} type="button" className={s.chip} onClick={() => p.onTexto(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** When nothing here answers it: a short card that leads to «Escríbele al equipo» (P-48). */
function Escribenos() {
  return (
    <section aria-labelledby="ayuda-escribenos" className={s.caja}>
      <h2 id="ayuda-escribenos" className={s.titulo}>
        ¿No lo encontraste?
      </h2>
      <p className={s.nada}>Escríbele al equipo de Xangarro. Lo ve con tu negocio adjunto.</p>
      <Link href="/ayuda/escribir" className={button({ variant: 'secondary', full: true })}>
        Escribirle al equipo
      </Link>
    </section>
  );
}

function Privacidad() {
  return (
    <p className={s.privacidad}>
      <strong>Privacidad y mis datos.</strong> Para ver, corregir o borrar tus datos personales, haz
      una <Link href="/privacidad/solicitud">solicitud ARCO</Link>. Te respondemos en un máximo de
      20 días hábiles.
    </p>
  );
}

/**
 * «Ayuda» (ADR-107): Don Cuentas asks what's wrong. The answer is usually one
 * of the most asked or a guide; a search or a topic narrows the list, and the
 * form to the team (N-08) is a page of its own for when nothing here answered it.
 */
export function AyudaScreen() {
  const [texto, setTexto] = useState('');
  const [tema, setTema] = useState<TemaId | null>(null);
  const [guia, setGuia] = useState<Guia | null>(null);
  const h = buscar(texto, tema);
  const acotado = texto.trim() !== '' || tema !== null;
  return (
    <>
      <Portada texto={texto} onTexto={setTexto} />
      <div className={s.cuerpo}>
        <div className={s.columna}>
          <Temas tema={tema} onTema={setTema} />
          <Preguntas
            key={`${tema ?? ''}|${texto}`}
            preguntas={h.preguntas}
            acotado={acotado}
            titulo={tituloDe(texto, tema)}
          />
        </div>
        <div className={s.columna}>
          <Guias guias={h.guias} onAbrir={setGuia} />
          <Escribenos />
        </div>
      </div>
      <Privacidad />
      <GuiaDrawer guia={guia} onCerrar={() => setGuia(null)} />
    </>
  );
}

function tituloDe(texto: string, tema: TemaId | null): string {
  if (texto.trim() !== '') return 'Lo que encontré';
  if (tema !== null) return TEMAS.find((t) => t.id === tema)?.label ?? 'Preguntas';
  return 'Lo más preguntado';
}
