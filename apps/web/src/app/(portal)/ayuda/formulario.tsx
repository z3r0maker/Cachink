'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';

import { Banner, Button } from '@/components';
import { button } from '@/components/button.css';
import { enviarAyuda, reportarFalla, type AyudaResult } from '@/server/actions/ayuda';
import type { Pantalla } from '@/shell/pantallas';
import { useUltimaPantalla } from '@/shell/ultima-pantalla';

import { Enviado } from './enviado';
import { Asunto, EnQuePantalla, Mensaje, Urgente, VaConElReporte } from './formulario-campos';
import * as s from './formulario.css';
import { QueNecesitas, type Que } from './que-necesitas';

/**
 * «Escríbele al equipo» (N-08; P-48, ADR-162 §8, board `RpAyuda`). It asks
 * first what the person needs. «Tengo una duda» is the form it always was:
 * asunto, mensaje, «Es urgente». «Algo no funciona» files a report that names
 * the screen the person came from, so two taps and no typing are enough.
 * Either way the card gives way to «Enviado».
 */
export interface FormularioAyudaProps {
  /** The account's display name, for the thanks; null when it never set one. */
  readonly nombre: string | null;
  /** Where the answer goes. */
  readonly correo: string;
}

export function FormularioAyuda({ nombre, correo }: FormularioAyudaProps) {
  const f = useEscribir();
  if (f.enviado) return <Enviado nombre={nombre} correo={correo} />;
  return (
    <div className={s.tarjeta}>
      <QueNecesitas value={f.que} onChange={f.setQue} />
      {f.que === null ? null : <Campos f={f} />}
      {f.error === null ? null : <Banner tone="critical" title={f.error} />}
      <div className={s.acciones}>
        <Link href="/ayuda" className={button({ variant: 'secondary', size: 'lg' })}>
          Cancelar
        </Link>
        {f.que === null ? null : (
          <Button variant="primary" size="lg" disabled={f.pending} onClick={f.enviar}>
            {f.pending ? 'Enviando…' : 'Enviar'}
          </Button>
        )}
      </div>
    </div>
  );
}

type Escribir = ReturnType<typeof useEscribir>;

/** What each answer asks for: a subject for a question, the screen for a report. */
function Campos({ f }: { readonly f: Escribir }) {
  const falla = f.que === 'falla';
  return (
    <>
      {falla ? (
        <EnQuePantalla pantalla={f.pantalla} recordada={f.recordada} onElegir={f.setElegida} />
      ) : (
        <Asunto value={f.asunto} onChange={f.setAsunto} />
      )}
      <Mensaje
        etiqueta={falla ? '¿Qué pasó?' : 'Mensaje'}
        ejemplo={
          falla
            ? 'Por ejemplo: quise descargar el Excel de ventas y no bajó nada'
            : 'Cuéntanos tu duda'
        }
        value={f.mensaje}
        onChange={f.setMensaje}
      />
      {falla ? <VaConElReporte /> : null}
      <Urgente value={f.urgente} onChange={f.setUrgente} />
    </>
  );
}

/** A new id per attempt; where `randomUUID` is missing (plain http), the same shape by hand. */
function nuevoIntento(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** What the person typed and picked. */
function useCampos() {
  const [que, setQue] = useState<Que | null>(null);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [elegida, setElegida] = useState<Pantalla | null>(null);
  const recordada = useUltimaPantalla();
  return {
    que,
    setQue,
    asunto,
    setAsunto,
    mensaje,
    setMensaje,
    urgente,
    setUrgente,
    setElegida,
    /** The screen the report names: the one picked, else the one the person came from. */
    pantalla: elegida ?? recordada,
    recordada: elegida === null && recordada !== null,
  };
}

/** State + send, split out so the components stay presentational. */
function useEscribir() {
  const campos = useCampos();
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [pending, start] = useTransition();
  // One id per report, minted at the first send and kept through its retries,
  // so a send that failed and is pressed again files a single item.
  const intento = useRef<string | null>(null);

  const mandar = (): Promise<AyudaResult> => {
    const { asunto, mensaje, urgente, pantalla } = campos;
    if (campos.que !== 'falla') return enviarAyuda({ asunto, mensaje, urgente });
    intento.current ??= nuevoIntento();
    return reportarFalla({
      pantalla: pantalla?.href ?? null,
      mensaje,
      urgente,
      intento: intento.current,
    });
  };

  const enviar = () =>
    start(async () => {
      setError(null);
      // The action answers its own failures; a rejection is the request not arriving.
      const r = await mandar().catch((): AyudaResult => ({
        ok: false,
        message: 'No pudimos enviarlo. Intenta de nuevo.',
      }));
      if (r.ok) setEnviado(true);
      else setError(r.message);
    });

  return { ...campos, error, enviado, pending, enviar };
}
