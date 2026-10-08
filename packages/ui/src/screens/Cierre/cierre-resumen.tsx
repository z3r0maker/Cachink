/**
 * Cierre's two read-only parts (MvCierre): «Efectivo esperado», the hero,
 * with the four parts under it (the ones Mi turno shows), and «Resumen del
 * turno», one line of the turno's figures.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { CierreData } from '@xangarro/caja/cierre';
import { formatMoney, type Money } from '@xangarro/domain';
import { Eyebrow, HeroPanel, MText, QuietPanel } from '../../components/index';
import { colors } from '../../theme';
import { Desglose } from '../MiTurno/mi-turno-esperado';

const NUM = { fontVariant: ['tabular-nums' as const] };

export function EsperadoCierre(p: { data: CierreData; esperado: Money }): ReactElement {
  return (
    <HeroPanel label="Efectivo esperado" testID="cierre-esperado">
      <Eyebrow color={colors.ink}>Efectivo esperado</Eyebrow>
      <MText
        size="xl6"
        weight="extraBold"
        letterSpacing={-1.2}
        marginTop={4}
        marginBottom={8}
        {...NUM}
      >
        {formatMoney(p.esperado)}
      </MText>
      <Desglose partes={p.data.partes} alto={32} />
    </HeroPanel>
  );
}

const plural = (n: number, uno: string, varios: string): string => (n === 1 ? uno : varios);

/** «12 ventas · 1 cancelada (12:58) · Fiado $182.00 · 3 entradas · 2 mermas». */
export function lineaResumen(r: CierreData['resumen']): string {
  const cancel = `${r.canceladas} ${plural(r.canceladas, 'cancelada', 'canceladas')}`;
  return [
    `${r.ventas} ${plural(r.ventas, 'venta', 'ventas')}`,
    r.canceladaHora ? `${cancel} (${r.canceladaHora})` : cancel,
    `Fiado ${formatMoney(r.fiado)}`,
    `${r.entradas} ${plural(r.entradas, 'entrada', 'entradas')}`,
    `${r.mermas} ${plural(r.mermas, 'merma', 'mermas')}`,
  ].join(' · ');
}

export function ResumenCierre({ data }: { data: CierreData }): ReactElement {
  return (
    <QuietPanel label="Resumen del turno" padding={16} testID="cierre-resumen">
      <View>
        <MText size="md" weight="semibold" color={colors.gray600} lineHeight={22} {...NUM}>
          {lineaResumen(data.resumen)}
        </MText>
      </View>
    </QuietPanel>
  );
}
