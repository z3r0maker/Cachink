/**
 * Inicio's greeting (MvInicio): Don waves once, here, with the greeting in
 * his bubble («¡Buenas tardes, Ana!» and, when it is, «La caja está lista.»),
 * then the day and the turno chip. The words are `saludo()` from the caja
 * package, the web's same line.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { saludo, type InicioData } from '@xangarro/caja/inicio';
import { MText } from '../../components/index';
import { DonBurbuja } from '../../components/Don/don-burbuja';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, shapeRadii } from '../../theme';

/** «¡Buenas tardes, Ana! La caja está lista.» → the heading and the line under it. */
export function partirSaludo(s: string): readonly [string, string | null] {
  const i = s.indexOf('! ');
  return i < 0 ? [s, null] : [s.slice(0, i + 1), s.slice(i + 2)];
}

function TurnoChip({ desde }: { desde: string | null }): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID="inicio-turno-chip"
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={28}
      paddingHorizontal={10}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <View
        width={8}
        height={8}
        borderRadius={shapeRadii.pill}
        backgroundColor={desde ? colors.green : colors.gray400}
      />
      <MText size="xs" weight="bold" color={colors.gray600}>
        {desde ? t('entrar.inicio.turnoAbierto', { hora: desde }) : t('entrar.inicio.turnoCerrado')}
      </MText>
    </View>
  );
}

export function InicioSaludo({ data }: { data: InicioData }): ReactElement {
  const [h1, linea] = partirSaludo(saludo(data));
  const abierto = data.situacion !== 'turno-cerrado' && data.turno !== null;
  return (
    <View gap={6}>
      <DonBurbuja pose="hola" size={76}>
        <MText role="heading" aria-level={1} size="xl4" weight="extraBold" letterSpacing={-0.9}>
          {h1}
        </MText>
        {linea ? (
          <MText size="md" weight="bold" color={colors.ink}>
            {linea}
          </MText>
        ) : null}
      </DonBurbuja>
      <View flexDirection="row" alignItems="center" gap={8} flexWrap="wrap">
        <MText size="sm" weight="semibold" color={colors.gray600}>
          {data.fecha.split(' · ')[0]}
        </MText>
        <TurnoChip desde={abierto ? (data.turno?.desde ?? null) : null} />
      </View>
    </View>
  );
}
