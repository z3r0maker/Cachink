'use client';

import { useState, useTransition } from 'react';

import { Banner, Button, Input } from '@/components';
import { enviarAyuda } from '@/server/actions/ayuda';
import { portalFontSizes } from '@xangarro/tokens';

/**
 * The form half of «Ayuda» (N-08), split from the screen for the size
 * ceiling: asunto, mensaje, «Es urgente», send. The expectations are
 * deliberately low — no ticket numbers, no threads.
 */
export function FormularioAyuda() {
  const f = useAyudaForm();
  return (
    <>
      {f.banner !== null ? <Banner tone={f.banner.tone} title={f.banner.text} /> : null}
      <div style={{ display: 'grid', gap: 14, maxWidth: 560, marginTop: 16 }}>
        <Input
          labelText="Asunto"
          value={f.asunto}
          onChange={(e) => f.setAsunto(e.target.value)}
          placeholder="No entiendo el corte del día"
          maxLength={120}
        />
        <MensajeYUrgencia
          mensaje={f.mensaje}
          setMensaje={f.setMensaje}
          urgente={f.urgente}
          setUrgente={f.setUrgente}
        />
        <div>
          <Button variant="primary" disabled={f.pending} onClick={f.enviar}>
            {f.pending ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
      </div>
    </>
  );
}

/** State + send action, split out so the components stay presentational. */
function useAyudaForm() {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'success' | 'critical'; text: string } | null>(null);
  const [pending, start] = useTransition();

  const enviar = () =>
    start(async () => {
      const r = await enviarAyuda({ asunto, mensaje, urgente });
      if (r.ok) {
        setBanner({ tone: 'success', text: 'Listo. El equipo de Xangarro recibió tu mensaje.' });
        setAsunto('');
        setMensaje('');
        setUrgente(false);
      } else {
        setBanner({ tone: 'critical', text: r.message });
      }
    });

  return { asunto, setAsunto, mensaje, setMensaje, urgente, setUrgente, banner, pending, enviar };
}

function MensajeYUrgencia({
  mensaje,
  setMensaje,
  urgente,
  setUrgente,
}: {
  readonly mensaje: string;
  readonly setMensaje: (v: string) => void;
  readonly urgente: boolean;
  readonly setUrgente: (v: boolean) => void;
}) {
  return (
    <>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
        Mensaje
        <MensajeTexto mensaje={mensaje} setMensaje={setMensaje} />
      </label>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={urgente}
          onChange={(e) => setUrgente(e.target.checked)}
          aria-label="Es urgente"
          style={{ width: 18, height: 18 }}
        />
        Es urgente — mi negocio no puede operar
      </label>
    </>
  );
}

function MensajeTexto({
  mensaje,
  setMensaje,
}: {
  readonly mensaje: string;
  readonly setMensaje: (v: string) => void;
}) {
  return (
    <textarea
      aria-label="Mensaje"
      value={mensaje}
      onChange={(e) => setMensaje(e.target.value)}
      placeholder="Paso a paso, qué esperabas y qué pasó…"
      rows={6}
      maxLength={4000}
      style={{
        border: '2px solid var(--black)',
        borderRadius: 10,
        padding: '10px 12px',
        fontFamily: 'inherit',
        fontSize: portalFontSizes.md,
        resize: 'vertical',
      }}
    />
  );
}
