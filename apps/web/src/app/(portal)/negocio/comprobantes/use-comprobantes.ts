'use client';

import { useState, useTransition } from 'react';

import { guardarComprobantes, type ComprobantesForm } from '@/server/actions/comprobantes';

import { HEX } from './muestra';
import { useSubirLogo } from './use-logo';

export interface ComprobantesView {
  readonly mayWrite: boolean;
  /** The business id, for the logo route's URL after an upload. */
  readonly businessId: string;
  readonly nombre: string;
  readonly iniciales: string;
  readonly logoUrl: string | null;
  readonly form: ComprobantesForm;
}

export type Aviso = { readonly tono: 'ok' | 'mal'; readonly texto: string } | null;

const KEYS: readonly (keyof ComprobantesForm)[] = [
  'receiptTemplate',
  'receiptLeyenda',
  'addressPrint',
  'direccion',
  'whatsapp',
  'brandColor',
];

const GUARDADO = 'Guardado. Tus cajas usan este comprobante desde la próxima venta.';

/**
 * The Comprobantes form (N-19): the draft the preview paints, what is saved,
 * and the hex being typed (it reaches the form only once it is a colour).
 */
export function useComprobantes(view: ComprobantesView) {
  const [form, setForm] = useState<ComprobantesForm>(view.form);
  const [saved, setSaved] = useState<ComprobantesForm>(view.form);
  const [hex, setHex] = useState(view.form.brandColor.toUpperCase());
  const [aviso, setAviso] = useState<Aviso>(null);
  const [version, setVersion] = useState(0);
  const [pending, start] = useTransition();

  const set = <K extends keyof ComprobantesForm>(key: K, value: ComprobantesForm[K]) => {
    setAviso(null);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const color = (v: string) => {
    setHex(v);
    const h = `#${v.trim().replace(/^#/, '')}`;
    if (HEX.test(h)) set('brandColor', h.toLowerCase());
  };
  const bump = () => setVersion((v) => v + 1);
  const guardar = () =>
    start(async () => {
      const r = await guardarComprobantes(form);
      if (!r.ok) return setAviso({ tono: 'mal', texto: r.message });
      setSaved(form);
      setAviso({ tono: 'ok', texto: GUARDADO });
      bump();
    });
  const descartar = () => {
    setForm(saved);
    setHex(saved.brandColor.toUpperCase());
    setAviso(null);
  };
  const logo = useSubirLogo(view, { color, setAviso, bump });
  const sucia = KEYS.some((k) => form[k] !== saved[k]);
  return { form, hex, aviso, version, pending, sucia, set, color, guardar, descartar, ...logo };
}

export type Comprobantes = ReturnType<typeof useComprobantes>;
