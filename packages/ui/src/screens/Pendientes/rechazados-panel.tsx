/**
 * RechazadosPanel — «El servidor no aceptó» (M-09; the phone's face of the
 * rows the old «No enviados» listed): each refused record with the server's
 * sentence and what to do, and «Reintentar» for the ones waiting for a
 * person. Automatic retries say so; there is deliberately no delete: the
 * record stays on this caja until the server accepts it.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { RechazoVisto } from '@xangarro/caja/pendientes';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderWidths, colors, radii } from '../../theme';

function Fila(p: { readonly x: RechazoVisto; readonly onReintentar: () => void }): ReactElement {
  const x = p.x;
  return (
    <View
      testID={`rechazado-${x.key}`}
      gap={6}
      padding={14}
      marginBottom={10}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      backgroundColor={colors.gray100}
    >
      <MText size="md" weight="extraBold">
        {x.detalle === '' ? x.titulo : `${x.titulo} · ${x.detalle}`}
      </MText>
      <MText size="sm" weight="semibold" color={colors.redText} testID={`rechazado-razon-${x.key}`}>
        {x.razon}
      </MText>
      {x.pista === null ? null : (
        <MText size="sm" weight="semibold" color={colors.gray600}>
          {x.pista}
        </MText>
      )}
      {x.reintentando ? (
        <MText size="xs" weight="extraBold" color={colors.gray600}>
          Reintentando automáticamente
        </MText>
      ) : (
        <Btn variant="dark" sentence onPress={p.onReintentar} testID={`rechazado-retry-${x.key}`}>
          Reintentar
        </Btn>
      )}
    </View>
  );
}

export function RechazadosPanel(p: {
  readonly rechazados: readonly RechazoVisto[];
  /** Requeues the rows that wait for a person (the given ones), then sends. */
  readonly onReintentar: (xs: readonly RechazoVisto[]) => void;
}): ReactElement {
  const personas = p.rechazados.filter((x) => !x.reintentando);
  return (
    <QuietPanel label="El servidor no aceptó" count={p.rechazados.length} testID="rechazados-panel">
      <View padding={14}>
        {personas.length > 1 ? (
          <View marginBottom={12}>
            <Btn
              variant="dark"
              sentence
              fullWidth
              onPress={() => p.onReintentar(personas)}
              testID="rechazados-retry-todos"
            >
              Reintentar todos
            </Btn>
          </View>
        ) : null}
        {p.rechazados.map((x) => (
          <Fila key={x.key} x={x} onReintentar={() => p.onReintentar([x])} />
        ))}
      </View>
    </QuietPanel>
  );
}
