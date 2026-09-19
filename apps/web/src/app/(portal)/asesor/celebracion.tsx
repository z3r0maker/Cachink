'use client';

import { useEffect, useState } from 'react';

import { Celebration } from '@/components/celebration';
import { celebrar } from '@/server/actions/metas';

/**
 * The goal-achieved takeover, shown once (P-33): the server only hands the
 * client a celebration whose `celebraciones` marker is missing, and the marker
 * is written the moment this renders — a reload, another device, anything
 * else already finds it. Never rendered for a viewer: the call site decides.
 */
export function CelebracionMeta({
  clave,
  racha,
}: {
  readonly clave: string;
  readonly racha: number;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    void celebrar(clave);
  }, [clave]);
  return (
    <Celebration
      open={open}
      onClose={() => setOpen(false)}
      title="¡Lograste tu meta!"
      body={`Tu negocio hizo lo que te propusiste este mes. Racha: ${racha} ${racha === 1 ? 'meta' : 'metas'} seguidas.`}
      level={racha >= 6 ? 'oro' : racha >= 3 ? 'plata' : 'bronce'}
      streak={racha}
    />
  );
}
