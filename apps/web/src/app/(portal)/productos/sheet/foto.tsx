'use client';

import type { ProductIcon } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, ConfirmDialog } from '@/components';
import { ProductPhoto } from '@/components/product-photo';
import { adivinaIcono } from '@/lib/adivina-icono';
import { quitarFotoProducto } from '@/server/actions/quitar-foto-producto';

import { fechaLarga } from '../../suscripcion/fecha';
import type { Producto } from '../parts';
import * as s from './foto.css';

/**
 * Apariencia's photo block (P-42, boards PtFotoEditar and PtFotoSinFoto).
 * The phone takes the photo (M-13); here it is shown large, with when and on
 * which register it was taken, and «Quitar foto», which confirms and applies
 * at once, apart from «Guardar cambios». Without a photo, the block says how
 * to take one on the phone: the portal never uploads.
 */
interface FotoProps {
  readonly producto: Producto;
  readonly fondo: string;
  /** Called once the tombstone is saved, so the sheet shows the no-photo state. */
  readonly onQuitada: () => void;
}

const QUITAR_CUERPO =
  'Vuelve a verse su ícono aquí y en tus cajas, en su siguiente sincronización. Para ponerle otra, tómala desde el teléfono.';

export function FotoBloque(props: FotoProps) {
  return props.producto.foto === null ? <SinFoto {...props} /> : <ConFoto {...props} />;
}

function Cuadro({ producto: p, fondo }: Pick<FotoProps, 'producto' | 'fondo'>) {
  return (
    <span className={s.cuadro} style={{ background: fondo }} aria-hidden={p.foto === null}>
      <ProductPhoto
        productoId={p.id}
        fotoId={p.foto?.id ?? null}
        icon={(p.icono as ProductIcon | null) ?? adivinaIcono(p.nombre)}
        glyphSize={44}
        size={108}
        alt={`Foto de ${p.nombre}`}
      />
    </span>
  );
}

function SinFoto(props: FotoProps) {
  return (
    <div className={s.vacio} data-testid="producto-sin-foto">
      <Cuadro {...props} />
      <span className={s.texto}>
        <strong className={s.titulo}>Sin foto</strong>
        <span className={s.nota}>
          Tómasela desde el teléfono: en Inventario, toca su cuadrito. Sale sin fondo y llega aquí
          sola.
        </span>
      </span>
    </div>
  );
}

function ConFoto(props: FotoProps) {
  const { foto } = props.producto;
  const tomada = foto
    ? `Tomada el ${fechaLarga(foto.tomadaEl)}${foto.caja ? ` en ${foto.caja}` : ''}`
    : '';
  return (
    <div className={s.bloque}>
      <Cuadro {...props} />
      <span className={s.texto}>
        <strong className={s.titulo}>Foto</strong>
        <span className={s.fecha}>{tomada}</span>
        <span className={s.nota}>Para cambiarla, tómale otra desde el teléfono.</span>
        <QuitarFoto producto={props.producto} onQuitada={props.onQuitada} />
      </span>
    </div>
  );
}

/** The confirm's state and the call; a refusal stays in the dialog, in the action's words. */
function useQuitarFoto(productoId: string, onQuitada: () => void) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const quitar = () =>
    startTransition(async () => {
      const r = await quitarFotoProducto(productoId);
      if (!r.ok) return setError(r.message);
      setOpen(false);
      onQuitada();
      router.refresh();
    });
  const abrir = () => {
    setError(null);
    setOpen(true);
  };
  return { open, setOpen, error, pending, quitar, abrir };
}

function QuitarFoto(props: Pick<FotoProps, 'producto' | 'onQuitada'>) {
  const q = useQuitarFoto(props.producto.id, props.onQuitada);
  return (
    <>
      <Button variant="danger" onClick={q.abrir}>
        Quitar foto
      </Button>
      <ConfirmDialog
        open={q.open}
        onOpenChange={q.setOpen}
        title={`¿Quitar la foto de ${props.producto.nombre}?`}
        body={q.error ?? QUITAR_CUERPO}
        cancelLabel="Mejor no"
        confirmLabel={q.pending ? 'Quitando…' : 'Quitar foto'}
        confirmDisabled={q.pending}
        destructive
        onConfirm={q.quitar}
      />
    </>
  );
}
