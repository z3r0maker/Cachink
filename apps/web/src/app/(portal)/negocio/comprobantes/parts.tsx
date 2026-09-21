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
 * Negocio → Comprobantes (N-19/N-20): logo, brand colour, the receipt
 * fields (C-15) and the live preview of the chosen template, rendered by
 * the domain renderer through the muestra route.
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

type Plantilla = ComprobantesForm['receiptTemplate'];

/**
 * The live preview (N-20): the saved branding over the business's last
 * venta, rendered by the same domain SVG the share PNG uses. The version
 * bumps on save and on logo upload, which is exactly when the bytes change.
 */
function VistaPrevia({
  plantilla,
  version,
}: {
  readonly plantilla: Plantilla;
  readonly version: number;
}) {
  const base = `/api/comprobantes/muestra?plantilla=${plantilla}`;
  return (
    <section data-testid="comprobante-vista-previa" style={{ margin: '24px 0 8px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>Así se ve</h2>
      <img
        data-testid="comprobante-preview-img"
        src={`${base}&formato=png&v=${version}`}
        alt="Vista previa del comprobante"
        style={{ maxWidth: 380, width: '100%', border: '2px solid var(--black)', display: 'block' }}
      />
      <p style={{ display: 'flex', gap: 18, margin: '10px 0 0' }}>
        <a href={`${base}&formato=png&v=${version}`} download>
          Descargar PNG
        </a>
        <a href={`${base}&formato=pdf&v=${version}`} download>
          Descargar PDF
        </a>
      </p>
    </section>
  );
}

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
      <DireccionYColor form={form} mayWrite={mayWrite} set={set} />
    </div>
  );
}

/** The address that prints (0028), its toggle, and the colour picker. */
function DireccionYColor({
  form,
  mayWrite,
  set,
}: {
  readonly form: ComprobantesForm;
  readonly mayWrite: boolean;
  readonly set: Set<keyof ComprobantesForm>;
}) {
  return (
    <>
      <Input
        labelText="Dirección que se imprime"
        value={form.direccion}
        disabled={!mayWrite}
        onChange={(e) => set('direccion', e.target.value)}
        placeholder="Av. Hidalgo 214, Col. Centro · Guadalajara, Jal."
        maxLength={140}
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
    </>
  );
}

function useComprobantes(view: ComprobantesView) {
  const [form, setForm] = useState<ComprobantesForm>(view.form);
  const [logoUrl, setLogoUrl] = useState<string | null>(view.logoUrl);
  const [banner, setBanner] = useState<{ tone: 'success' | 'critical'; text: string } | null>(null);
  const [version, setVersion] = useState(0);
  const [pending, start] = useTransition();
  const [subiendo, startSubida] = useTransition();

  const set = <K extends keyof ComprobantesForm>(key: K, value: ComprobantesForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const ok = (text: string) => setBanner({ tone: 'success', text });
  const mal = (message: string) => setBanner({ tone: 'critical', text: message });

  const guardar = () =>
    start(async () => {
      const r = await guardarComprobantes(form);
      if (r.ok) {
        ok('Guardado.');
        setVersion((v) => v + 1);
      } else mal(r.message);
    });

  const subir = (file: File | null) => {
    if (file === null) return;
    const data = new FormData();
    data.append('logo', file);
    startSubida(async () => {
      const r = await subirLogo(data);
      if (!r.ok) return mal(r.message);
      ok('Logo guardado.');
      setVersion((v) => v + 1);
      if (r.brandColor !== null) set('brandColor', r.brandColor);
      // The bytes changed under the same URL; the version keeps the <img>
      // honest until the ETag takes over.
      setLogoUrl(`/api/logos/${view.businessId}?v=${Date.now()}`);
    });
  };

  return { form, logoUrl, banner, version, pending, subiendo, set, guardar, subir };
}

export function ComprobantesScreen(view: ComprobantesView) {
  const { form, logoUrl, banner, version, pending, subiendo, set, guardar, subir } =
    useComprobantes(view);

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

      <VistaPrevia plantilla={form.receiptTemplate} version={version} />

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
