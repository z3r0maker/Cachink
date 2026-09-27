'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components';
import { solicitarHazloPorMi } from '@/server/actions/hazlo-por-mi';

import { ENVUELVE } from '../_primeros/boton';
import { Aviso } from '../_primeros/aviso';
import * as f from '../_primeros/archivo.css';
import * as p from '../_primeros/primeros.css';
import * as s from './hazlo.css';

/** The request form half of «Hazlo por mí» (N-18): what you use today, what to migrate, the files. */
export function Solicitud({
  onBanner,
}: {
  readonly onBanner: (tone: 'success' | 'critical', text: string) => void;
}) {
  const h = useSolicitud(onBanner);
  return (
    <>
      <Campos sistema={h.sistema} setSistema={h.setSistema} notas={h.notas} setNotas={h.setNotas} />
      <Adjuntar archivos={h.archivos} onElegir={h.setArchivos} />
      {h.falta ? (
        <Aviso tono="critical">Cuéntanos qué usas hoy (tu sistema actual) para mandarla.</Aviso>
      ) : null}
      <Button
        variant={h.listo ? 'primary' : 'secondary'}
        size="lg"
        full
        style={ENVUELVE}
        disabled={h.pending}
        onClick={h.enviar}
      >
        {h.pending ? 'Enviando…' : 'Mandar solicitud'}
      </Button>
      <p className={p.nota} style={{ textAlign: 'center' }}>
        {h.listo
          ? 'Una solicitud a la vez. Nada se guarda sin tu aprobación.'
          : 'Cuéntanos qué usas hoy para mandarla.'}
      </p>
    </>
  );
}

function useSolicitud(onBanner: (tone: 'success' | 'critical', text: string) => void) {
  const [sistema, setSistema] = useState('');
  const [notas, setNotas] = useState('');
  const [archivos, setArchivos] = useState<readonly File[]>([]);
  const [falta, setFalta] = useState(false);
  const [pending, start] = useTransition();
  const listo = sistema.trim() !== '';
  const enviar = () => {
    if (!listo) return setFalta(true);
    setFalta(false);
    start(async () => {
      const form = new FormData();
      form.append('sistema_actual', sistema);
      form.append('notas', notas);
      for (const a of archivos) form.append('archivos', a);
      const r = await solicitarHazloPorMi(form);
      if (r.ok) onBanner('success', 'Solicitud enviada. Te avisamos por correo.');
      else onBanner('critical', r.message);
    });
  };
  return {
    sistema,
    setSistema,
    notas,
    setNotas,
    archivos,
    setArchivos,
    falta,
    pending,
    listo,
    enviar,
  };
}

function Campos(props: {
  readonly sistema: string;
  readonly setSistema: (v: string) => void;
  readonly notas: string;
  readonly setNotas: (v: string) => void;
}) {
  return (
    <>
      <div className={s.campo}>
        <label htmlFor="hpm-sistema" className={s.label}>
          ¿Qué usas hoy?
        </label>
        <input
          id="hpm-sistema"
          className={s.input}
          aria-label="Sistema actual"
          value={props.sistema}
          onChange={(e) => props.setSistema(e.target.value)}
          placeholder="Excel, una libreta, otro sistema"
          maxLength={120}
        />
      </div>
      <div className={s.campo}>
        <label htmlFor="hpm-notas" className={s.label}>
          ¿Qué datos quieres migrar?
        </label>
        <textarea
          id="hpm-notas"
          className={s.textarea}
          aria-label="Qué datos migrar"
          value={props.notas}
          onChange={(e) => props.setNotas(e.target.value)}
          placeholder="Productos, clientes… lo que tengas."
          rows={3}
          maxLength={2000}
        />
      </div>
    </>
  );
}

function Adjuntar({
  archivos,
  onElegir,
}: {
  readonly archivos: readonly File[];
  readonly onElegir: (files: readonly File[]) => void;
}) {
  return (
    <label className={s.adjuntar}>
      <IconoClip />
      <span className={s.adjuntarTexto}>
        <span className={s.fuerte}>
          {archivos.length === 0 ? 'Adjuntar archivos' : archivos.map((a) => a.name).join(', ')}
        </span>
        <span className={p.nota}>
          {archivos.length === 0
            ? '.xlsx o .csv, hasta 5, de 20 MB cada uno'
            : `${archivos.length} ${archivos.length === 1 ? 'archivo listo' : 'archivos listos'}. Toca para cambiarlos.`}
        </span>
      </span>
      <input
        type="file"
        multiple
        accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className={f.archivoOculto}
        data-testid="hazlo-por-mi-archivo"
        onChange={(e) => onElegir([...(e.target.files ?? [])])}
      />
    </label>
  );
}

function IconoClip() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" />
    </svg>
  );
}
