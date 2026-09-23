'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components';
import { button } from '@/components/button.css';
import { generarQr } from '@/server/actions/pairing-qr';

/**
 * The scan half of the pairing panel (C-14, P-06): «Mostrar QR» mints a
 * 15-minute link for the live code and shows it as a QR, with «Copiar enlace»
 * and «Compartir por WhatsApp». The link never contains the typed code, and
 * the token is shown only here — a reload means «Mostrar QR» again.
 *
 * Copy follows ADR-069: «Vincular este teléfono a tu negocio», never
 * «activar» or «licencia».
 */
interface Qr {
  readonly link: string;
  readonly svgDataUri: string;
  readonly expiresAt: string;
}

function minutos(expiresAt: string): number {
  return Math.max(1, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60_000));
}

function QrVisible({ qr }: { readonly qr: Qr }) {
  const [copiado, setCopiado] = useState(false);
  const texto = `Vincula tu teléfono a nuestro negocio en Xangarro: ${qr.link}`;
  return (
    <div
      data-testid="pairing-qr"
      style={{ marginTop: 14, display: 'grid', gap: 10, justifyItems: 'start' }}
    >
      <img
        src={qr.svgDataUri}
        alt="Código QR para vincular un teléfono"
        width={184}
        height={184}
        style={{ background: '#fff', borderRadius: 12, padding: 8 }}
      />
      <p style={{ margin: 0 }}>
        Escanéalo con la cámara del teléfono para vincularlo a tu negocio. Vence en{' '}
        {minutos(qr.expiresAt)} min y sirve una sola vez.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant="secondary"
          onClick={() => void navigator.clipboard.writeText(qr.link).then(() => setCopiado(true))}
        >
          {copiado ? 'Enlace copiado' : 'Copiar enlace'}
        </Button>
        <a
          className={button({ variant: 'secondary' })}
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          data-testid="pairing-qr-whatsapp"
        >
          Compartir por WhatsApp
        </a>
      </div>
    </div>
  );
}

export function PairingQr({ codeKey }: { readonly codeKey: string }) {
  const [qr, setQr] = useState<{ readonly forCode: string; readonly value: Qr } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mostrar = () =>
    startTransition(async () => {
      const r = await generarQr();
      if (!r.ok) return setError(r.message);
      setError(null);
      setQr({ forCode: codeKey, value: r });
    });
  // A new code expires the old one, and its QR with it: never show a dead QR.
  const visible = qr !== null && qr.forCode === codeKey ? qr.value : null;
  return (
    <div style={{ marginTop: 12 }}>
      <Button
        variant="secondary"
        onClick={mostrar}
        disabled={pending}
        data-testid="pairing-qr-button"
      >
        {pending ? 'Generando…' : visible === null ? 'Mostrar QR' : 'Generar otro QR'}
      </Button>
      {error === null ? null : <p role="alert">{error}</p>}
      {visible === null ? null : <QrVisible qr={visible} />}
    </div>
  );
}
