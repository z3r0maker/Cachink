/**
 * Step 2's fixed foot (M-17, MvCierreFlujo): the one close button, the
 * difference in its words («Cerrar turno con faltante de $70.00»), blocked
 * only while the reason (or its note) is missing — records still to send
 * never block it (ADR-123) — «Volver a contar» under it, and the hint saying
 * what is missing or what closing does.
 */
import type { ReactElement } from 'react';
import { cerrarLabel, pistaCerrar, type EstadoConteo } from '@xangarro/caja/cierre';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';

/** What is missing, or what closing does. */
function Pista(p: { readonly e: EstadoConteo }): ReactElement {
  return (
    <MText
      size="sm"
      weight="semibold"
      color={colors.gray600}
      textAlign="center"
      testID="cierre-cerrar"
    >
      {pistaCerrar(p.e.faltaMotivo, p.e.faltaNota)}
    </MText>
  );
}

export function CierreCerrar(p: {
  readonly e: EstadoConteo;
  readonly guardando: boolean;
  readonly onCerrar: () => void;
  readonly onVolver: () => void;
}): ReactElement {
  return (
    <>
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
      <Btn
        variant="secondary"
        size="lg"
        sentence
        fullWidth
        disabled={p.guardando}
        onPress={p.onVolver}
        testID="cierre-volver-a-contar"
      >
        Volver a contar
      </Btn>
      <Pista e={p.e} />
    </>
  );
}
