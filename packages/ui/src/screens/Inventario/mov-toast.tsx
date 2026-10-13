/**
 * The confirmation a movement leaves (M-09, the board's toast): a white
 * card with the thin black edge, the kind's tinted head and its check, the
 * sentence under it, and the «Entendido» button. It stays until the
 * operator closes it, like the web's. `useMovToast` holds it: the write
 * goes through, the toast says what stayed in the turno.
 */
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import {
  toastDe,
  type Existencia,
  type NuevoMovimientoVivo,
  type ToastMov,
} from '@xangarro/caja/inventario';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii, shadows } from '../../theme';
import { CheckCuadro, tinteDeTipo } from './mover-glifos';

export interface MovToastVivo {
  readonly toast: ToastMov | null;
  /** The route's write, then the confirmation for what it recorded. */
  readonly guardar: (m: NuevoMovimientoVivo, items: readonly Existencia[]) => Promise<void>;
  readonly cerrar: () => void;
}

export function useMovToast(registrar: (m: NuevoMovimientoVivo) => Promise<void>): MovToastVivo {
  const [toast, setToast] = useState<ToastMov | null>(null);
  const guardar = async (m: NuevoMovimientoVivo, items: readonly Existencia[]): Promise<void> => {
    const nombre = items.find((i) => i.id === m.existenciaId)?.nombre ?? '';
    await registrar(m);
    setToast(toastDe(m, nombre));
  };
  return { toast, guardar, cerrar: () => setToast(null) };
}

function Cabeza(p: { readonly x: ToastMov }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      minHeight={48}
      paddingLeft={12}
      paddingRight={2}
      paddingVertical={4}
      backgroundColor={tinteDeTipo(p.x.tipo)}
      borderBottomWidth={borderWidths.thin}
      borderBottomColor={colors.black}
    >
      <CheckCuadro />
      <MText flex={1} weight="extraBold">
        {p.x.tipo === 'Merma' ? 'Merma registrada' : 'Entrada registrada'}
      </MText>
    </View>
  );
}

function Entendido(p: { readonly onClose: () => void }): ReactElement {
  return (
    <Pressable
      testID="mov-toast-entendido"
      role="button"
      accessibilityLabel="Entendido"
      onPress={p.onClose}
      style={({ pressed }) => ({
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii[3],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: colors.white,
        boxShadow: shadows.small,
        ...(pressed
          ? { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: shadows.pressed }
          : null),
      })}
    >
      <MText size="sm" weight="extraBold" style={{ textTransform: 'uppercase' }}>
        Entendido
      </MText>
    </Pressable>
  );
}

export function MovToast(p: { readonly x: ToastMov; readonly onClose: () => void }): ReactElement {
  return (
    <View
      testID="mov-toast"
      role="status"
      position="absolute"
      left={12}
      right={12}
      bottom={76}
      backgroundColor={colors.white}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      borderRadius={radii[4]}
      style={{ boxShadow: shadows.card, overflow: 'hidden' }}
    >
      <Cabeza x={p.x} />
      <View padding={14} gap={12}>
        <MText size="md" weight="bold">
          {p.x.body}
        </MText>
        <Entendido onClose={p.onClose} />
      </View>
    </View>
  );
}
