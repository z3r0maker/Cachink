'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, ConfirmDialog, ScreenBody } from '@/components';
import type { EstadoSeguridad } from '@/server/acceso/seguridad';
import { desactivarVerificacion, generarCodigosNuevos } from '@/server/actions/seguridad';
import { useReconfirmar } from '@/shell/reconfirmar';

import * as p from '../privacidad/privacidad.css';
import { Activar } from './activar';
import { CodigosNuevos } from './codigos';
import { Apagada, Cuando, Encendida } from './tarjetas';

const DESACTIVADA =
  'Listo, la verificación en dos pasos quedó apagada. Tus códigos de recuperación ya no sirven.';

/** What is open over the page: the enrolment panel, fresh codes, or the turn-off question. */
type Abierto = 'activar' | 'desactivar' | { readonly codigos: readonly string[] } | null;

function useSeguridad() {
  const [abierto, setAbierto] = useState<Abierto>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const { protegido } = useReconfirmar();
  const router = useRouter();

  const nuevosCodigos = () =>
    startTransition(async () => {
      const r = await protegido(generarCodigosNuevos);
      if (r === null) return;
      if (!r.ok) return setAviso({ ok: false, texto: r.message });
      setAviso(null);
      setAbierto({ codigos: r.codigos });
    });
  const desactivar = () =>
    startTransition(async () => {
      const r = await protegido(desactivarVerificacion);
      if (r === null) return;
      setAbierto(null);
      setAviso(r.ok ? { ok: true, texto: DESACTIVADA } : { ok: false, texto: r.message });
      if (r.ok) router.refresh();
    });
  const cerrar = () => {
    setAbierto(null);
    router.refresh();
  };
  return { abierto, setAbierto, aviso, pending, nuevosCodigos, desactivar, cerrar };
}

type Seguridad = ReturnType<typeof useSeguridad>;

function Tarjetas({ estado, s }: { readonly estado: EstadoSeguridad; readonly s: Seguridad }) {
  return (
    <div className={p.pila}>
      {s.aviso === null ? null : (
        <Banner tone={s.aviso.ok ? 'success' : 'critical'} title={s.aviso.texto} />
      )}
      {estado.activa ? (
        <Encendida
          estado={estado}
          ocupado={s.pending}
          onCodigos={s.nuevosCodigos}
          onDesactivar={() => s.setAbierto('desactivar')}
        />
      ) : (
        <Apagada onActivar={() => s.setAbierto('activar')} />
      )}
      <Cuando activa={estado.activa} />
    </div>
  );
}

/** The panel, the fresh codes and the turn-off question: one of them at a time, or none. */
function Encima({ s }: { readonly s: Seguridad }) {
  const codigos = typeof s.abierto === 'object' && s.abierto !== null ? s.abierto.codigos : null;
  return (
    <>
      <Activar open={s.abierto === 'activar'} onClose={s.cerrar} />
      <CodigosNuevos codigos={codigos} onClose={s.cerrar} />
      <ConfirmDialog
        open={s.abierto === 'desactivar'}
        onOpenChange={(open) => (open ? undefined : s.setAbierto(null))}
        title="¿Desactivar la verificación en dos pasos?"
        body="Tu cuenta vuelve a entrar solo con tu contraseña y tus códigos de recuperación dejan de servir. La puedes activar otra vez cuando quieras."
        confirmLabel="Sí, desactivar"
        cancelLabel="Mejor no"
        destructive
        confirmDisabled={s.pending}
        onConfirm={s.desactivar}
      />
    </>
  );
}

/** The page's column: the title, then the cards; the error state when it could not load. */
export function SeguridadPantalla({ estado }: { readonly estado: EstadoSeguridad | null }) {
  const s = useSeguridad();
  return (
    <div className={p.pila}>
      <h1 className={p.titulo}>Seguridad</h1>
      <p className={p.bajada}>Cómo proteges la entrada a tu portal.</p>
      <ScreenBody
        state={estado === null ? 'error' : 'happy'}
        onRetry={() => window.location.reload()}
      >
        {estado === null ? null : <Tarjetas estado={estado} s={s} />}
      </ScreenBody>
      <Encima s={s} />
    </div>
  );
}
