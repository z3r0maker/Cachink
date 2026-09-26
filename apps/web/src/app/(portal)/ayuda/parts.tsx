'use client';

import { useState } from 'react';

import { Don } from '@/components';

import * as s from './ayuda.css';
import { buscar } from './buscar';
import type { TemaId } from './contenido';
import { FormularioAyuda } from './formulario';
import { GuiaDrawer } from './guia-drawer';
import type { Guia } from './guias';
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

/** When nothing here answers it: the form to the Xangarro team, and ARCO. */
function Escribenos() {
  return (
    <section aria-labelledby="ayuda-escribenos" className={s.caja}>
      <h2 id="ayuda-escribenos" className={s.titulo}>
        ¿No lo encontraste? Escríbenos
      </h2>
      <p className={s.nada}>El equipo de Xangarro lo ve con tu negocio adjunto.</p>
      <FormularioAyuda />
      <p className={s.privacidad}>
        <strong>Privacidad y mis datos.</strong> Para ver, corregir o borrar tus datos personales,
        haz una <a href="/privacidad/solicitud">solicitud ARCO</a>. Te respondemos en un máximo de
        20 días hábiles.
      </p>
    </section>
  );
}

/**
 * «Ayuda» (ADR-107): Don Cuentas asks what's wrong; the answer is usually a
 * quick one or a guide, and the form to the team (N-08) is there when not.
 */
export function AyudaScreen() {
  const [texto, setTexto] = useState('');
  const [tema, setTema] = useState<TemaId | null>(null);
  const [guia, setGuia] = useState<Guia | null>(null);
  const h = buscar(texto, tema);
  return (
    <>
      <Portada texto={texto} onTexto={setTexto} />
      <div className={s.cuerpo}>
        <div className={s.columna}>
          <Temas tema={tema} onTema={setTema} />
          <Preguntas preguntas={h.preguntas} />
        </div>
        <div className={s.columna}>
          <Guias guias={h.guias} onAbrir={setGuia} />
          <Escribenos />
        </div>
      </div>
      <GuiaDrawer guia={guia} onCerrar={() => setGuia(null)} />
    </>
  );
}
