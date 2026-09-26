'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { ConfirmDialog, Input, OptionCards } from '@/components';
import { pesosToCentavos } from '@/lib/money';
import { registrarMovimiento } from '@/server/actions/movimientos';

import type { Producto } from './parts';

/**
 * Record a stock movement for one product (ADR-081). It reaches every phone on
 * its next pull, so their stock agrees with the portal's.
 *
 * Salidas leave out «Venta»: sales are captured on the phones, and a sale
 * typed here would be a sale with no ticket.
 */
type Tipo = 'entrada' | 'salida';

const TIPOS = [
  {
    value: 'entrada',
    title: 'Entrada',
    description: 'Suma existencias: compra, devolución, ajuste.',
  },
  { value: 'salida', title: 'Salida', description: 'Resta existencias: merma, muestra, ajuste.' },
] as const;

const MOTIVOS: Record<Tipo, readonly string[]> = {
  entrada: [
    'Compra a proveedor',
    'Devolución de cliente',
    'Ajuste de inventario',
    'Producción',
    'Otro',
  ],
  salida: ['Merma / daño', 'Uso en producción', 'Muestra', 'Ajuste de inventario', 'Otro'],
};

const pesos = (centavos: bigint): string =>
  `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;

function useFields(producto: Producto | null) {
  const [tipo, setTipo] = useState<Tipo>('entrada');
  const [motivo, setMotivo] = useState(MOTIVOS.entrada[0] as string);
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Re-seed when a different row opens the dialog; the cost starts at the product's.
  useEffect(() => {
    setTipo('entrada');
    setMotivo(MOTIVOS.entrada[0] as string);
    setCantidad('');
    setCosto(producto === null ? '' : pesos(producto.costo));
    setError(null);
  }, [producto]);

  const chooseTipo = (t: Tipo): void => {
    setTipo(t);
    setMotivo(MOTIVOS[t][0] as string);
  };
  return {
    tipo,
    chooseTipo,
    motivo,
    setMotivo,
    cantidad,
    setCantidad,
    costo,
    setCosto,
    error,
    setError,
  };
}

type Fields = ReturnType<typeof useFields>;

function useSave(producto: Producto | null, f: Fields, onClose: () => void) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  // Synchronous, so a button smash cannot slip past it between render and
  // `pending` flipping true — five rapid clicks yield one movement.
  const saving = useRef(false);

  function save(): void {
    if (producto === null || saving.current) return;
    const cantidad = Number(f.cantidad);
    const costoUnitCentavos = pesosToCentavos(f.costo);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return f.setError('La cantidad es un número entero mayor que 0.');
    }
    if (costoUnitCentavos === null) return f.setError('Escribe el costo, por ejemplo 12.50');
    saving.current = true;
    startTransition(async () => {
      const result = await registrarMovimiento({
        productoId: producto.id,
        tipo: f.tipo,
        cantidad,
        costoUnitCentavos,
        motivo: f.motivo,
      });
      if (!result.ok) {
        saving.current = false; // a real error must be retryable
        return f.setError(result.message);
      }
      onClose();
      router.refresh();
    });
  }
  return { pending, save };
}

function MovimientoFields({ f }: { readonly f: Fields }) {
  return (
    <>
      <OptionCards
        ariaLabel="Tipo de movimiento"
        options={TIPOS}
        value={f.tipo}
        onValueChange={(v) => f.chooseTipo(v as Tipo)}
      />
      <OptionCards
        ariaLabel="Motivo"
        options={MOTIVOS[f.tipo].map((m) => ({ value: m, title: m, description: '' }))}
        value={f.motivo}
        onValueChange={f.setMotivo}
      />
      <Input
        labelText="Cantidad"
        numeric
        value={f.cantidad}
        onChange={(e) => f.setCantidad(e.target.value)}
        data-testid="movimiento-cantidad"
      />
      <Input
        labelText="Costo unitario"
        hintText="En pesos"
        value={f.costo}
        onChange={(e) => f.setCosto(e.target.value)}
        error={f.error ?? undefined}
        data-testid="movimiento-costo"
      />
    </>
  );
}

export function MovimientoDialog(props: {
  readonly producto: Producto | null;
  readonly onClose: () => void;
}) {
  const f = useFields(props.producto);
  const { pending, save } = useSave(props.producto, f, props.onClose);
  return (
    <ConfirmDialog
      open={props.producto !== null}
      onOpenChange={(open) => (open ? undefined : props.onClose())}
      title={`Movimiento · ${props.producto?.nombre ?? ''}`}
      body="Llega a todas tus cajas en su siguiente sincronización."
      confirmLabel={pending ? 'Guardando…' : 'Registrar'}
      confirmDisabled={pending}
      onConfirm={save}
    >
      <MovimientoFields f={f} />
    </ConfirmDialog>
  );
}
