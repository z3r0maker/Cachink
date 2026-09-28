/**
 * «Producto nuevo en caja» (MvProductoNuevo): a bottom sheet over Cobrar with
 * three questions and a look at the tile. It saves through the phone's
 * quick-add path and goes straight into the ticket; the owner finishes it
 * (cost, stock) in the portal. From the escáner it arrives with the code.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { InventoryCategory, Product } from '@xangarro/domain';
import { mayuscula } from '@xangarro/caja';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { colors } from '../../theme';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import { CodigoCard, Nombre, Precio, Pregunta, Tipos } from './producto-nuevo-partes';
import { Vista } from './producto-nuevo-vista';
import { useProductoNuevo, type ProductoNuevoForm } from './use-producto-nuevo';

export interface ProductoNuevoSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** The scanned code, when the escáner sent it. */
  readonly codigo: string | null;
  /** The types the catalogue already uses; one or none hides the question. */
  readonly tipos: readonly InventoryCategory[];
  /** «Pedro», or «el dueño». */
  readonly dueno: string;
  readonly onGuardar: (input: CrearProductoInput) => Promise<Product>;
  /** Saved: the route puts it in the ticket and says so. */
  readonly onListo: (p: Product) => void;
}

function Nota({ dueno }: { dueno: string }): ReactElement {
  return (
    <View flexDirection="row" gap={8} alignItems="flex-start">
      <PathIcon d={COBRAR_GLYPHS.info} size={18} color={colors.gray600} />
      <MText flex={1} size="md" weight="semibold" color={colors.gray600}>
        {`Se vende desde ya. ${mayuscula(dueno)} lo revisa en su catálogo y le pone el costo.`}
      </MText>
    </View>
  );
}

function Pie(p: {
  f: ProductoNuevoForm;
  guardando: boolean;
  error: boolean;
  onAgregar: () => void;
}): ReactElement {
  return (
    <View gap={8}>
      {p.error ? (
        <MText role="alert" size="md" weight="bold" color={colors.redText}>
          No se pudo guardar. Revisa el nombre y vuelve a intentarlo.
        </MText>
      ) : null}
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={!p.f.ok}
        loading={p.guardando}
        icon={p.f.ok ? <PathIcon d={COBRAR_GLYPHS.mas} size={18} strokeWidth={2.6} /> : undefined}
        onPress={p.onAgregar}
        testID="producto-nuevo-agregar"
      >
        {p.f.ok ? 'Agregar y ponerlo en el ticket' : 'Escribe el nombre y el precio'}
      </Btn>
    </View>
  );
}

function Formulario(p: ProductoNuevoSheetProps & { f: ProductoNuevoForm }): ReactElement {
  return (
    <View gap={18}>
      {p.codigo ? <CodigoCard codigo={p.codigo} /> : null}
      <Pregunta n={1} texto="¿Cómo se llama?">
        <Nombre f={p.f} />
      </Pregunta>
      <Pregunta n={2} texto="¿En cuánto lo vendes?">
        <Precio f={p.f} />
      </Pregunta>
      {p.tipos.length > 1 ? (
        <Pregunta n={3} texto="¿De qué tipo es?">
          <Tipos f={p.f} tipos={p.tipos} />
        </Pregunta>
      ) : null}
      <Vista f={p.f} />
      <Nota dueno={p.dueno} />
    </View>
  );
}

/** Mounted fresh on every opening, so a new product never starts from the last one. */
function Abierto(p: ProductoNuevoSheetProps): ReactElement {
  const f = useProductoNuevo(p.codigo, p.tipos);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const agregar = async (): Promise<void> => {
    if (!f.ok || guardando) return;
    setGuardando(true);
    setError(false);
    try {
      p.onListo(await p.onGuardar(f.payload()));
    } catch {
      setError(true);
    } finally {
      setGuardando(false);
    }
  };
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow={p.tipos.length > 1 ? '3 preguntas y a vender' : '2 preguntas y a vender'}
      title="Producto nuevo en caja"
      closeLabel="Cerrar sin agregar"
      testID="producto-nuevo-sheet"
      footer={<Pie f={f} guardando={guardando} error={error} onAgregar={() => void agregar()} />}
    >
      <Formulario {...p} f={f} />
    </BottomSheet>
  );
}

export function ProductoNuevoSheet(p: ProductoNuevoSheetProps): ReactElement | null {
  return p.open ? <Abierto {...p} /> : null;
}
