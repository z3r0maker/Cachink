/**
 * Mi turno's head (MvTurno): the operator's initials, «Mi turno», and «Ana
 * Robledo, desde las 08:15 · jueves 14 de mayo». While the operator
 * continues someone else's turno (M-21), «Sigues el turno de …» under it.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { TurnoData } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { inicialesDe } from '../AppShell/use-shell-data';
import { SigueDe } from './mi-turno-sigue-de';

/** «Ana Robledo, desde las 08:15 · jueves 14 de mayo»; no day, no « · ». */
const lineaDe = (d: TurnoData): string =>
  `${d.operador}, desde las ${d.desde}${d.dia === '' ? '' : ` · ${d.dia}`}`;

function Avatar(p: { readonly nombre: string }): ReactElement {
  return (
    <View
      width={48}
      height={48}
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellowSoft}
      aria-hidden
    >
      <MText size="lg" weight="extraBold">
        {inicialesDe(p.nombre)}
      </MText>
    </View>
  );
}

export function MiTurnoCabeza(p: { readonly data: TurnoData }): ReactElement {
  return (
    <View gap={8}>
      <View flexDirection="row" alignItems="center" gap={12}>
        <Avatar nombre={p.data.operador} />
        <View flex={1} minWidth={0}>
          <MText size="xl4" weight="extraBold" letterSpacing={-0.8} role="heading">
            Mi turno
          </MText>
          <MText size="md" weight="semibold" color={colors.gray600} testID="turno-cabeza-linea">
            {lineaDe(p.data)}
          </MText>
        </View>
      </View>
      {p.data.titular === undefined ? null : (
        <SigueDe titular={p.data.titular} desde={p.data.desde} />
      )}
    </View>
  );
}
