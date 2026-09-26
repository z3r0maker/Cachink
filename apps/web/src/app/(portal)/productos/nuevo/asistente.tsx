'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components';

import { useProductoForm } from '../sheet/use-producto-form';
import * as s from './nuevo.css';
import { errorDelPaso, PASOS, type Paso } from './pasos';
import { PasoDos, PasoTres, PasoUno } from './preguntas';
import { Vista } from './vista';

/** The three steps as a numbered path; a done step is a way back to it. */
function Camino({ paso, ir }: { readonly paso: Paso; readonly ir: (p: Paso) => void }) {
  return (
    <ol className={s.camino} aria-label="Pasos">
      {PASOS.map((p) => (
        <li key={p.paso}>
          <button
            type="button"
            className={s.pasoBoton[p.paso === paso ? 'actual' : p.paso < paso ? 'hecho' : 'falta']}
            aria-current={p.paso === paso ? 'step' : undefined}
            disabled={p.paso > paso}
            onClick={() => ir(p.paso)}
          >
            <span className={s.pasoNum}>{p.paso < paso ? '✓' : p.paso}</span>
            {p.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

function useAsistente() {
  const router = useRouter();
  const f = useProductoForm(null, () => router.push('/productos'));
  const [paso, setPaso] = useState<Paso>(1);
  const [aviso, setAviso] = useState<string | null>(null);
  const siguiente = () => {
    const error = errorDelPaso(f.draft, paso);
    setAviso(error);
    if (error !== null) return;
    if (paso === 3) f.save();
    else setPaso((paso + 1) as Paso);
  };
  const ir = (p: Paso) => {
    setAviso(null);
    setPaso(p);
  };
  return { f, paso, siguiente, ir, error: aviso ?? f.error };
}

function Migas() {
  return (
    <nav className={s.migas} aria-label="Ruta">
      <Link href="/productos">Productos</Link>
      <span aria-hidden="true">›</span>
      <span>Nuevo producto</span>
      <Link href="/productos" className={s.cancelar}>
        Cancelar
      </Link>
    </nav>
  );
}

function Acciones({ a }: { readonly a: ReturnType<typeof useAsistente> }) {
  return (
    <div className={s.acciones}>
      {a.paso > 1 ? (
        <Button variant="ghost" onClick={() => a.ir((a.paso - 1) as Paso)}>
          Atrás
        </Button>
      ) : null}
      <span className={s.empuja} />
      <Button onClick={a.siguiente} disabled={a.f.pending} size="lg">
        {a.paso < 3 ? 'Siguiente' : a.f.pending ? 'Guardando…' : 'Crear producto'}
      </Button>
    </div>
  );
}

/**
 * «Nuevo producto» (ADR-107): what it is, what it costs, whether it is
 * counted — one question per step, the caja tile and Don Cuentas beside them.
 * The rules and the save are the drawer's (`useProductoForm`).
 */
export function NuevoProducto() {
  const a = useAsistente();
  const props = { draft: a.f.draft, set: a.f.set };
  return (
    <div className={s.pagina}>
      <Migas />
      <div className={s.cabeza}>
        <h1 className={s.titulo}>Nuevo producto</h1>
        <Camino paso={a.paso} ir={a.ir} />
      </div>
      <div className={s.cuerpo}>
        <section className={s.tarjeta} aria-label={PASOS[a.paso - 1]?.label}>
          {a.paso === 1 ? <PasoUno {...props} /> : null}
          {a.paso === 2 ? <PasoDos {...props} /> : null}
          {a.paso === 3 ? <PasoTres {...props} /> : null}
          {a.error === null ? null : (
            <p role="alert" className={s.error} data-testid="producto-error">
              {a.error}
            </p>
          )}
          <Acciones a={a} />
        </section>
        <Vista draft={a.f.draft} paso={a.paso} />
      </div>
    </div>
  );
}
