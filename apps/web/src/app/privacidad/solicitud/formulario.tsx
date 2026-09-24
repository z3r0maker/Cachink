'use client';

import { Ban, Eye, PencilLine, ShieldOff, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { portalFontSizes } from '@xangarro/tokens';

import { Banner, Button, Input, OptionCards } from '@/components';
import { enviarSolicitudArco, type ArcoResult } from '@/server/actions/arco';

const DERECHOS = [
  {
    value: 'acceso',
    title: 'Acceso',
    description: 'Saber qué datos tuyos tenemos y cómo los usamos.',
    icon: <Eye size={20} aria-hidden="true" />,
  },
  {
    value: 'rectificacion',
    title: 'Rectificación',
    description: 'Corregir datos inexactos o incompletos.',
    icon: <PencilLine size={20} aria-hidden="true" />,
  },
  {
    value: 'cancelacion',
    title: 'Cancelación',
    description: 'Que borremos tus datos de nuestros sistemas.',
    icon: <Trash2 size={20} aria-hidden="true" />,
  },
  {
    value: 'oposicion',
    title: 'Oposición',
    description: 'Que dejemos de usar tus datos para un fin.',
    icon: <Ban size={20} aria-hidden="true" />,
  },
  {
    value: 'revocacion',
    title: 'Revocar consentimiento',
    description: 'Retirar un permiso que nos diste.',
    icon: <ShieldOff size={20} aria-hidden="true" />,
  },
] as const;

const textarea = {
  border: '2px solid var(--black)',
  borderRadius: 10,
  padding: '10px 12px',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  resize: 'vertical',
} as const;

/** Form state and the send action, apart so the component stays presentational. */
function useArcoForm() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [derecho, setDerecho] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [result, setResult] = useState<ArcoResult | null>(null);
  const [pending, start] = useTransition();
  const enviar = () =>
    start(async () => {
      setResult(await enviarSolicitudArco({ nombre, correo, derecho, descripcion }));
    });
  return {
    ...{ nombre, setNombre, correo, setCorreo, derecho, setDerecho },
    ...{ descripcion, setDescripcion, result, pending, enviar },
  };
}

/** The ARCO form: who you are, which right, what exactly; then the folio. */
export function FormularioArco() {
  const f = useArcoForm();
  if (f.result?.ok) return <Recibida folio={f.result.folio} responderA={f.result.responderA} />;
  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
      {f.result && !f.result.ok ? <Banner tone="critical" title={f.result.message} /> : null}
      <Input
        labelText="Nombre completo"
        value={f.nombre}
        onChange={(e) => f.setNombre(e.target.value)}
        maxLength={120}
      />
      <Input
        labelText="Correo para la respuesta"
        type="email"
        value={f.correo}
        onChange={(e) => f.setCorreo(e.target.value)}
        maxLength={200}
      />
      <OptionCards
        options={DERECHOS}
        value={f.derecho}
        onValueChange={f.setDerecho}
        ariaLabel="Qué derecho quieres ejercer"
      />
      <Descripcion value={f.descripcion} onChange={f.setDescripcion} />
      <div>
        <Button variant="primary" disabled={f.pending} onClick={f.enviar}>
          {f.pending ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </div>
    </div>
  );
}

function Descripcion(props: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
      Qué datos y qué necesitas
      <textarea
        aria-label="Qué datos y qué necesitas"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        rows={6}
        maxLength={4000}
        style={textarea}
      />
    </label>
  );
}

function Recibida({ folio, responderA }: { readonly folio: string; readonly responderA: string }) {
  const dia = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${responderA}T12:00:00Z`),
  );
  return (
    <div data-testid="arco-recibida" style={{ marginTop: 16 }}>
      <Banner tone="success" title="Recibimos tu solicitud." />
      <p>
        Tu folio es <strong data-testid="arco-folio">{folio}</strong>. Guárdalo: te lo pediremos al
        responderte.
      </p>
      <p>
        Te respondemos por correo a más tardar el <strong data-testid="arco-plazo">{dia}</strong>.
      </p>
    </div>
  );
}
