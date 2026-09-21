'use client';

import { useState, useTransition } from 'react';

import { Button, WhatsAppDialog } from '@/components';
import { resumenParaCompartir } from '@/server/actions/asesor';

import { archivoDe, mensajeDiagnostico, type DatosCompartir } from './compartir-mensajes';

/**
 * P-32's diagnóstico variant: the message carries the month's real figures,
 * fetched on open — the share never invents a number.
 */
export function CompartirDiagnostico() {
  const [datos, setDatos] = useState<DatosCompartir | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const abrir = () => {
    start(async () => {
      const r = await resumenParaCompartir();
      if (!r.ok) return; // The message needs real figures; without them, nothing opens.
      setDatos({ negocio: r.negocio, mes: r.mes, ventas: r.ventas, utilidad: r.utilidad });
      setOpen(true);
    });
  };

  return (
    <>
      <div style={{ marginTop: 18 }} data-no-print>
        <Button variant="secondary" onClick={abrir} disabled={pending}>
          {pending ? 'Armando el mensaje…' : 'Compartir diagnóstico'}
        </Button>
      </div>
      {datos === null ? null : (
        <WhatsAppDialog
          open={open}
          onOpenChange={setOpen}
          mensaje={mensajeDiagnostico(datos)}
          archivo={archivoDe('diagnostico', datos.mes)}
        />
      )}
    </>
  );
}
