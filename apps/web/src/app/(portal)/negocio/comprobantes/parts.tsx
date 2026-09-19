'use client';

import { useState, useTransition } from 'react';

import { Banner, Button, Input, OptionCards, Switch, type OptionDef } from '@/components';
import {
  guardarComprobantes,
  subirLogo,
  type ComprobantesForm,
} from '@/server/actions/comprobantes';

import { ColorRow, LogoCard } from './brand-widgets';

import { pageSubtitle, pageTitle } from '../negocio.css';

/**
 * Negocio → Comprobantes (N-19): logo, brand colour and the receipt fields
 * (C-15). The template picker will drive N-20's live preview; today it
 * stores the choice.
 */

const TEMPLATES: readonly OptionDef[] = [
  { value: 'clasico', title: 'Clásico', description: 'Bordes marcados, todo visible.' },
  { value: 'moderno', title: 'Moderno', description: 'Aire, jerarquía y tu color.' },
  { value: 'ticket', title: 'Ticket', description: 'Angosto, para impresora de ticket.' },
  { value: 'minimal', title: 'Minimal', description: 'Solo lo esencial.' },
];

export interface ComprobantesView {
  readonly mayWrite: boolean;
  /** The business id, for the logo route's URL after an upload. */
  readonly businessId: string;
  readonly logoUrl: string | null;
  readonly form: ComprobantesForm;
}

type Set<K extends keyof ComprobantesForm> = (key: K, value: ComprobantesForm[K]) => void;

/** The receipt fields below the template picker (C-15's columns). */
function Campos({
  form,
  mayWrite,
  set,
}: {
  readonly form: ComprobantesForm;
  readonly mayWrite: boolean;
  readonly set: Set<keyof ComprobantesForm>;
}) {
  return (
    <div style={{ display: 'grid', gap: 14, maxWidth: 460, marginTop: 24 }}>
      <Input
        labelText="Leyenda al pie"
        value={form.receiptLeyenda}
        disabled={!mayWrite}
        onChange={(e) => set('receiptLeyenda', e.target.value)}
        placeholder="¡Gracias por tu compra!"
      />
      <Input
        labelText="WhatsApp del negocio"
        value={form.whatsapp}
        disabled={!mayWrite}
        onChange={(e) => set('whatsapp', e.target.value)}
        placeholder="55 1234 5678"
      />
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}>
        <Switch
          checked={form.addressPrint}
          disabled={!mayWrite}
          onCheckedChange={(v) => set('addressPrint', v)}
          label="Imprimir la dirección en el comprobante"
        />
        Imprimir la dirección
      </label>
      <ColorRow value={form.brandColor} disabled={!mayWrite} onPick={(v) => set('brandColor', v)} />
    </div>
  );
}

function useComprobantes(view: ComprobantesView) {
  const [form, setForm] = useState<ComprobantesForm>(view.form);
  const [logoUrl, setLogoUrl] = useState<string | null>(view.logoUrl);
  const [banner, setBanner] = useState<{ tone: 'success' | 'critical'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [subiendo, startSubida] = useTransition();

  const set = <K extends keyof ComprobantesForm>(key: K, value: ComprobantesForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const ok = (text: string) => setBanner({ tone: 'success', text });
  const mal = (message: string) => setBanner({ tone: 'critical', text: message });

  const guardar = () =>
    start(async () => {
      const r = await guardarComprobantes(form);
      if (r.ok) ok('Guardado.');
      else mal(r.message);
    });

  const subir = (file: File | null) => {
    if (file === null) return;
    const data = new FormData();
    data.append('logo', file);
    startSubida(async () => {
      const r = await subirLogo(data);
      if (!r.ok) return mal(r.message);
      ok('Logo guardado.');
      if (r.brandColor !== null) set('brandColor', r.brandColor);
      // The bytes changed under the same URL; the version keeps the <img>
      // honest until the ETag takes over.
      setLogoUrl(`/api/logos/${view.businessId}?v=${Date.now()}`);
    });
  };

  return { form, logoUrl, banner, pending, subiendo, set, guardar, subir };
}

export function ComprobantesScreen(view: ComprobantesView) {
  const { form, logoUrl, banner, pending, subiendo, set, guardar, subir } = useComprobantes(view);

  return (
    <>
      <h1 className={pageTitle}>Comprobantes</h1>
      <p className={pageSubtitle}>Tu logo y cómo se ven tus comprobantes</p>
      {banner !== null ? <Banner tone={banner.tone} title={banner.text} /> : null}

      <LogoCard logoUrl={logoUrl} mayWrite={view.mayWrite} subiendo={subiendo} onFile={subir} />

      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '28px 0 12px' }}>Plantilla</h2>
      <OptionCards
        ariaLabel="Plantilla del comprobante"
        options={TEMPLATES}
        value={form.receiptTemplate}
        onValueChange={(v) => set('receiptTemplate', v as ComprobantesForm['receiptTemplate'])}
      />

      <Campos form={form} mayWrite={view.mayWrite} set={set} />

      {view.mayWrite ? (
        <div style={{ marginTop: 20 }}>
          <Button variant="primary" disabled={pending} onClick={guardar}>
            {pending ? 'Guardando…' : 'Guardar comprobantes'}
          </Button>
        </div>
      ) : null}
    </>
  );
}
