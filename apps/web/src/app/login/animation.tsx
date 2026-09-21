'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import { escenario, escenarioVista } from './animation.css';
import { EscenaCobro } from './escena-cobro';
import { EscenaEstados } from './escena-estados';
import { EscenaVenta } from './escena-venta';
import { EscenaUtilidad } from './animation-utilidad';
import { TOTAL_MS, escenaEn } from './animation-clock';

/**
 * The login animation (P-02): four scenes on a fixed 460×170 stage, uniformly
 * scaled to the panel. One `requestAnimationFrame` loop owns the elapsed time
 * and writes the three money counters directly to the DOM — per-frame state
 * would re-render the tree sixty times a second. The loop pauses while any
 * input is focused (nobody should fight a moving stage to type) and, under
 * `prefers-reduced-motion`, scene four holds with the counters at rest.
 *
 * Transcribed from `Xangarro Portal - Acceso y onboarding.dc.html`; the
 * durations, ramps and keyframes are the design file's own.
 */
export function AnimacionAcceso({ 'data-testid': testId }: { readonly 'data-testid'?: string }) {
  const vista = useRef<HTMLDivElement>(null);
  const total = useRef<HTMLSpanElement>(null);
  const cobrado = useRef<HTMLSpanElement>(null);
  const utilidad = useRef<HTMLSpanElement>(null);
  const { escena, escala } = useEscenario(vista, total, cobrado, utilidad);

  return (
    <div className={escenarioVista} data-testid={testId} data-escena={escena}>
      <div ref={vista} style={{ position: 'absolute', inset: 0 }} />
      <div className={escenario} style={{ transform: `translate(-50%,-50%) scale(${escala})` }}>
        {escena === 0 ? <EscenaVenta total={<span ref={total}>$4,705.00</span>} /> : null}
        {escena === 1 ? <EscenaCobro cobrado={<span ref={cobrado}>$0.00</span>} /> : null}
        {escena === 2 ? <EscenaEstados /> : null}
        {escena === 3 ? <EscenaUtilidad utilidad={<span ref={utilidad}>$0.00</span>} /> : null}
      </div>
    </div>
  );
}

const dinero = (n: number): string => `$${Math.round(n).toLocaleString('es-MX')}.00`;

const rampa = (p: number, a: number, b: number): number =>
  Math.max(0, Math.min(1, (p - a) / (b - a)));
const suave = (x: number): number => 1 - Math.pow(1 - x, 3);

const RAMPAS = {
  ventas: (p: number) => 4705 + 145 * rampa(p, 0.66, 0.86),
  cobrado: (p: number) => 4850 * suave(rampa(p, 0.14, 0.82)),
  utilidad: (p: number) => 3610 * suave(rampa(p, 0.42, 0.9)),
} as const;

/**
 * The engine: scene index + uniform scale, and the three counters written
 * straight to the DOM from one rAF loop.
 */
function useEscenario(
  vista: RefObject<HTMLDivElement | null>,
  total: RefObject<HTMLSpanElement | null>,
  cobrado: RefObject<HTMLSpanElement | null>,
  utilidad: RefObject<HTMLSpanElement | null>,
) {
  const [escena, setEscena] = useState(0);
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const el = vista.current;
      if (el === null) return;
      const s = Math.max(0.45, Math.min(1.7, el.clientWidth / 460, el.clientHeight / 170));
      setEscala((prev) => (Math.abs(s - prev) > 0.005 ? s : prev));
    });
    if (vista.current !== null) ro.observe(vista.current);

    const escribe = (r: RefObject<HTMLSpanElement | null>, v: number) => {
      if (r.current !== null) r.current.textContent = dinero(v);
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setEscena(3);
      escribe(total, 4850);
      escribe(cobrado, 4850);
      escribe(utilidad, 3610);
      return () => ro.disconnect();
    }
    return correr({ ro, escribe, setEscena, total, cobrado, utilidad });
  }, [vista, total, cobrado, utilidad]);

  return { escena, escala };
}

/** The moving path: focus pause + the rAF clock. Split for the line budget. */
function correr(entrada: {
  readonly ro: ResizeObserver;
  readonly escribe: (r: RefObject<HTMLSpanElement | null>, v: number) => void;
  readonly setEscena: (f: (prev: number) => number) => void;
  readonly total: RefObject<HTMLSpanElement | null>;
  readonly cobrado: RefObject<HTMLSpanElement | null>;
  readonly utilidad: RefObject<HTMLSpanElement | null>;
}): () => void {
  let pausado = false;
  const enFoco = (e: FocusEvent) => {
    if ((e.target as HTMLElement | null)?.tagName !== 'INPUT') return;
    pausado = e.type === 'focusin';
  };
  document.addEventListener('focusin', enFoco);
  document.addEventListener('focusout', enFoco);

  let ultima = performance.now();
  let transcurrido = 0;
  let raf = 0;
  const tick = (ahora: number) => {
    const dt = ahora - ultima;
    ultima = ahora;
    if (!pausado) transcurrido = (transcurrido + dt) % TOTAL_MS;
    const { i, p } = escenaEn(transcurrido);
    entrada.setEscena((prev) => (prev === i ? prev : i));
    if (i === 0) entrada.escribe(entrada.total, RAMPAS.ventas(p));
    if (i === 1) entrada.escribe(entrada.cobrado, RAMPAS.cobrado(p));
    if (i === 3) entrada.escribe(entrada.utilidad, RAMPAS.utilidad(p));
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    entrada.ro.disconnect();
    document.removeEventListener('focusin', enFoco);
    document.removeEventListener('focusout', enFoco);
  };
}
