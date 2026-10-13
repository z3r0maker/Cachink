/**
 * The one close button on Cierre (Track M, M-09): the difference in its
 * words («Cerrar turno con faltante de $70.00»), blocked only while the
 * reason (or its note) is missing — records still to send never block it
 * (ADR-123) — with the hint under it saying which is missing.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { cerrarHint, cerrarLabel, type EstadoConteo } from '@xangarro/caja/cierre';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';

export function CierreCerrar(p: {
  readonly e: EstadoConteo;
  readonly guardando: boolean;
  readonly onCerrar: () => void;
}): ReactElement {
  return (
    <View gap={8} testID="cierre-cerrar">
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={!p.e.puede}
        loading={p.guardando}
        onPress={p.onCerrar}
        testID="cierre-cerrar-turno"
      >
        {cerrarLabel(p.e.dif)}
      </Btn>
      <MText size="xs" weight="semibold" color={colors.gray600} textAlign="center">
        {cerrarHint(p.e.faltaMotivo, p.e.faltaNota)}
      </MText>
    </View>
  );
}
