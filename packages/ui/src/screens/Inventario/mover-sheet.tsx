/**
 * «¿Qué pasó con la mercancía?» (MvInventario's sheet, the web's side panel
 * `MoverExistencia`): «Llegó mercancía» (how much, who brought it if you
 * want, a note) or «Se echó a perder o se dañó (merma)» (how much, what
 * happened, always, and a note). The footer says what the move does and
 * records it. Whole units only: the domain counts in integers.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { conUnidad, type TipoMovimiento } from '@xangarro/caja/inventario';
import { BottomSheet, Btn, MText } from '../../components/index';
import { colors } from '../../theme';
import type { ExistenciaMovil } from './inventario-registro';
import { Articulo, Motivos, Opcional } from './mover-campos-registro';
import { Cantidad } from './mover-cantidad';
import { Tipos } from './mover-tipos';
import { borradorInicial, cta, listo, paso, quedan, type Borrador } from './mover-logica';

export interface MoverSheetProps {
  /** The product being moved; null keeps the sheet closed. */
  readonly e: ExistenciaMovil | null;
  readonly tipo: TipoMovimiento;
  /** «Pedro», or «el dueño» until the caja knows the name. */
  readonly dueno: string;
  readonly registrando: boolean;
  readonly error: string | null;
  readonly onClose: () => void;
  readonly onRegistrar: (b: Borrador, e: ExistenciaMovil) => void;
}

function Campos(p: { b: Borrador; e: ExistenciaMovil; set: (b: Borrador) => void }): ReactElement {
  const { b, e, set } = p;
  const merma = b.tipo === 'Merma';
  return (
    <View gap={16} paddingTop={4}>
      <Tipos value={b.tipo} onChange={(tipo) => set(borradorInicial(tipo))} />
      <Articulo e={e} />
      <Cantidad
        label={merma ? '¿Cuánto se echó a perder?' : '¿Cuánto llegó?'}
        cantidad={b.cantidad}
        unidad={conUnidad(b.cantidad, e.unidad).replace(/^\S+ /, '')}
        quedan={quedan(b, e)}
        onPaso={(d) => set({ ...b, cantidad: paso(b, e, d) })}
      />
      {merma ? (
        <Motivos value={b.motivo} onChange={(motivo) => set({ ...b, motivo })} />
      ) : (
        <Opcional
          label="¿Quién la trajo?"
          placeholder="Ej. Carnicería La Central"
          value={b.proveedor}
          onChange={(proveedor) => set({ ...b, proveedor })}
          testID="mover-proveedor"
        />
      )}
      <Opcional
        label="Nota"
        placeholder={merma ? 'Ej. se quedó fuera del refri' : 'Ej. venía en nota de remisión'}
        value={b.nota}
        onChange={(nota) => set({ ...b, nota })}
        testID="mover-nota"
      />
    </View>
  );
}

function Pie(p: MoverSheetProps & { b: Borrador; e: ExistenciaMovil }): ReactElement {
  const merma = p.b.tipo === 'Merma';
  return (
    <View gap={10}>
      {p.error ? (
        <MText role="alert" size="md" weight="bold" color={colors.redText} testID="mover-error">
          {p.error}
        </MText>
      ) : (
        <MText size="sm" weight="semibold" color={colors.gray600}>
          {`${merma ? 'Esto baja' : 'Esto sube'} el inventario y ${p.dueno} lo ve en sus números.`}
        </MText>
      )}
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={!listo(p.b, p.e) || p.registrando}
        loading={p.registrando}
        onPress={() => p.onRegistrar(p.b, p.e)}
        testID="mover-registrar"
      >
        {cta(p.b, p.e)}
      </Btn>
    </View>
  );
}

export function MoverSheet(p: MoverSheetProps): ReactElement | null {
  const [b, set] = useState<Borrador>(() => borradorInicial(p.tipo));
  const id = p.e?.id ?? null;
  useEffect(() => set(borradorInicial(p.tipo)), [id, p.tipo]);
  if (p.e === null) return null;
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow="Movimiento de inventario"
      title="¿Qué pasó con la mercancía?"
      closeLabel="Cerrar movimiento"
      footer={<Pie {...p} b={b} e={p.e} />}
      testID="mover-sheet"
    >
      <Campos b={b} e={p.e} set={set} />
    </BottomSheet>
  );
}
