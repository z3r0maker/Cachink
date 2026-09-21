'use client';

import { useEffect, useState } from 'react';

import { Celebration } from '@/components/celebration';
import { WhatsAppDialog } from '@/components/whatsapp-dialog';
import { celebrar } from '@/server/actions/metas';

import { archivoDe, mensajeLogro } from './compartir-mensajes';

/**
 * The goal-achieved takeover, shown once (P-33): the server only hands the
 * client a celebration whose `celebraciones` marker is missing, and the marker
 * is written the moment this renders — a reload, another device, anything
 * else already finds it. Never rendered for a viewer: the call site decides.
 */
export function CelebracionMeta({
  clave,
  racha,
  mes,
  vendido,
  negocio,
}: {
  readonly clave: string;
  readonly racha: number;
  /** `YYYY-MM` of the goal that closed, and what it earned (P-32's share). */
  readonly mes: string;
  readonly vendido: bigint;
  readonly negocio: string;
}) {
  const [open, setOpen] = useState(true);
  const [compartir, setCompartir] = useState(false);
  useEffect(() => {
    void celebrar(clave);
  }, [clave]);
  return (
    <>
      <Celebration
        open={open}
        onClose={() => setOpen(false)}
        title="¡Lograste tu meta!"
        body={`Tu negocio hizo lo que te propusiste este mes. Racha: ${racha} ${racha === 1 ? 'meta' : 'metas'} seguidas.`}
        level={racha >= 6 ? 'oro' : racha >= 3 ? 'plata' : 'bronce'}
        streak={racha}
        onShare={() => setCompartir(true)}
      />
      <WhatsAppDialog
        open={compartir}
        onOpenChange={setCompartir}
        mensaje={mensajeLogro({ negocio, mes, vendido })}
        archivo={archivoDe('logro', mes)}
      />
    </>
  );
}
