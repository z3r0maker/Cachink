/**
 * What a turno list shows instead of its rows (El Mostrador §8; the caja's
 * `OperadorEstado`): the loader, the error with «Reintentar», and the empty
 * state on a quiet panel with Don listening. Shared by Ventas and Gastos.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { Don } from '../../components/Don/index';
import { ErrorState } from '../../components/ErrorState/index';
import { MText } from '../../components/Mostrador/index';
import { Spinner } from '../../components/Spinner/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

export function Cargando({ testID }: { readonly testID: string }): ReactElement {
  return (
    <View flex={1} minHeight={200} alignItems="center" justifyContent="center" testID={testID}>
      <Spinner />
    </View>
  );
}

export function FallaLista(p: {
  readonly titulo: string;
  readonly onRetry: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <ErrorState
      title={p.titulo}
      body="Revisa que la caja tenga espacio y vuelve a intentar. Tus datos siguen guardados."
      retryLabel="Reintentar"
      onRetry={p.onRetry}
      testID={p.testID}
    />
  );
}

export function Vacio(p: {
  readonly titulo: string;
  readonly cuerpo: string;
  readonly accion?: ReactNode;
  readonly testID: string;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      alignItems="center"
      gap={6}
      paddingVertical={24}
      paddingHorizontal={20}
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <Don pose="quieto" size={96} />
      <MText size="lg" weight="extraBold" textAlign="center">
        {p.titulo}
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600} textAlign="center">
        {p.cuerpo}
      </MText>
      {p.accion ? <View marginTop={8}>{p.accion}</View> : null}
    </View>
  );
}

/** Inside the list's panel when the chips or the search leave nothing. */
export function SinResultados(p: { readonly titulo: string; readonly cuerpo: string }) {
  return (
    <View paddingVertical={32} paddingHorizontal={20} gap={6} alignItems="center">
      <MText size="lg" weight="extraBold" textAlign="center">
        {p.titulo}
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600} textAlign="center">
        {p.cuerpo}
      </MText>
    </View>
  );
}
