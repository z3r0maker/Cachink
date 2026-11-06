/**
 * The camera's view where there is no camera (web, unit tests): the dark
 * square stays, and the shutter returns nothing. Metro picks
 * `foto-visor.native.tsx` on the phone.
 */
import { useImperativeHandle, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { colors } from '../theme';
import type { FotoVisorProps } from './foto-visor-tipos';

export function FotoVisor(p: FotoVisorProps): ReactElement {
  useImperativeHandle(p.ref, () => ({ tomar: () => Promise.resolve(null) }), []);
  return <View testID="foto-visor" flex={1} backgroundColor={colors.ink} />;
}
