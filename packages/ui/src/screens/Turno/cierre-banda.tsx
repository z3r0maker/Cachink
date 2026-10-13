/**
 * The «por enviar» band on Mi turno and Cierre (Track M, M-09; ADR-123,
 * DS-06 (a)): a warning, never a block — the close below stays enabled while
 * records wait, because the expected cash comes from this caja's own rows,
 * all of them here. «Reintentar envío» skips the wait; «Ver cuáles» opens
 * Registros por enviar when the route wired it.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { BANDA_CUERPO, BANDA_SIN_RED, bandaTitulo } from '@xangarro/caja/cierre';
import { Don } from '../../components/Don/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii, shadows } from '../../theme';

export interface CierreBandaProps {
  readonly porEnviar: number;
  readonly reintentando: number;
  /** The retry was asked for and the connection is still gone. */
  readonly sinRed: boolean;
  readonly enviando: boolean;
  readonly onReintentar: () => void;
  /** Opens «Registros por enviar»; omitted while that screen is not wired. */
  readonly onVerCuales?: () => void;
}

/** The queue as the band counts it; the route reads it from the sync state. */
export type ColaCierre = CierreBandaProps;

function Acciones(p: CierreBandaProps): ReactElement {
  return (
    <View flexDirection="row" gap={10} flexWrap="wrap" alignItems="center">
      <Btn
        variant="secondary"
        size="md"
        loading={p.enviando}
        onPress={p.onReintentar}
        testID="cierre-reintentar-envio"
      >
        Reintentar envío
      </Btn>
      {p.onVerCuales === undefined ? null : (
        <Btn variant="quiet" size="md" onPress={p.onVerCuales} testID="cierre-ver-cuales">
          Ver cuáles
        </Btn>
      )}
    </View>
  );
}

/** The band while records wait; the close itself never blocks (ADR-123). */
export function CierreBanda(p: CierreBandaProps): ReactElement {
  return (
    <View
      testID="cierre-por-enviar"
      role="status"
      gap={12}
      padding={16}
      borderRadius={radii[6]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={colors.warningSoft}
      style={{ boxShadow: shadows.hero }}
    >
      <View flexDirection="row" alignItems="center" gap={12}>
        <Don pose="preocupado" size={64} />
        <View flex={1} minWidth={0} gap={2}>
          <MText size="body" weight="extraBold">
            {bandaTitulo(p.porEnviar, p.reintentando)}
          </MText>
          <MText size="sm" weight="semibold" color={colors.gray600}>
            {BANDA_CUERPO}
          </MText>
        </View>
      </View>
      <Acciones {...p} />
      {p.sinRed ? (
        <MText size="sm" weight="semibold" color={colors.warningText}>
          {BANDA_SIN_RED}
        </MText>
      ) : null}
    </View>
  );
}
