/**
 * Don Cuentas on Registros por enviar (RvEnvio): his note under the queue
 * (nothing is lost, and the turno still closes), and the queue with nothing
 * left to send (Don, and the owner who already has it).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { NOTA_NADA_SE_PIERDE, todoEnviado } from '@xangarro/caja/pendientes';
import { EstadoVacio } from '../../components/CajaEstado/index';
import { Don } from '../../components/Don/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii } from '../../theme';

/** Don beside his note (RvEnvio): nothing is lost, and the turno still closes. */
export function NadaSePierde(): ReactElement {
  return (
    <View testID="por-enviar-nota" flexDirection="row" alignItems="center" gap={10}>
      <Don pose="ayuda" size={76} />
      <View
        flex={1}
        gap={3}
        paddingVertical={10}
        paddingHorizontal={12}
        borderRadius={radii[4]}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
        backgroundColor={colors.yellowSoft}
      >
        <MText size="md" weight="extraBold">
          {NOTA_NADA_SE_PIERDE.titulo}
        </MText>
        <MText size="sm" weight="semibold" color={colors.ink} lineHeight={18}>
          {NOTA_NADA_SE_PIERDE.cuerpo}
        </MText>
      </View>
    </View>
  );
}

/**
 * Nothing left to send (RvEnvio «Todo enviado»): Don, and «los patrones»
 * already have it. No button: the board draws none, and the owner chose
 * (2026-11-20) not to push toward closing from here.
 */
export function TodoEnviado(p: {
  readonly ultima?: string | null;
}): ReactElement {
  const t = todoEnviado(p.ultima ?? null);
  return <EstadoVacio id="por-enviar-todo-enviado" title={t.titulo} body={t.cuerpo} />;
}
