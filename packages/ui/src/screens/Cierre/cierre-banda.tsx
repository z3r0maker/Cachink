/**
 * «Tienes 3 registros por enviar (1 se reintentará solo).» (the web's
 * `banda.tsx`, EsMvCierre): a warning, not a block (ADR-123, DS-06 (a)): the
 * expected cash is this caja's own rows, all on the phone, so the close stays
 * open; «Reintentar envío» sends now and «Ver cuáles» opens Por enviar.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { BANDA_CUERPO, BANDA_NO_SE_PUDO, bandaTitulo } from '@xangarro/caja/cierre';
import { Btn, GLYPHS, MText, PathIcon } from '../../components/index';
import { borderWidths, colors, radii } from '../../theme';
import type { ColaCierre } from './cierre-tipos';

function Acciones(p: {
  cola: ColaCierre;
  onIntento: () => void;
  onVerCuales: () => void;
}): ReactElement {
  const { cola } = p;
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <Btn
          variant="secondary"
          size="lg"
          fullWidth
          loading={cola.enviando}
          onPress={() => {
            p.onIntento();
            cola.reintentar();
          }}
          testID="cierre-reintentar"
        >
          {cola.enviando ? 'Enviando…' : 'Reintentar envío'}
        </Btn>
      </View>
      <Btn
        variant="quiet"
        size="lg"
        onPress={p.onVerCuales}
        testID="cierre-ver-cuales"
        icon={<PathIcon d={GLYPHS.chevronRight} size={16} strokeWidth={2.4} />}
      >
        Ver cuáles
      </Btn>
    </View>
  );
}

const TILE = {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

/** «Enviando…» while it sends; after a retry that left records, that it keeps trying. */
function estadoTxt(cola: ColaCierre, intentado: boolean): string {
  if (cola.enviando) return 'Enviando…';
  return intentado && cola.porEnviar > 0 ? BANDA_NO_SE_PUDO : '';
}

export function Banda(p: { cola: ColaCierre; onVerCuales: () => void }): ReactElement {
  const [intentado, setIntentado] = useState(false);
  const { cola } = p;
  return (
    <View
      role="alert"
      testID="cierre-por-enviar"
      gap={10}
      padding={14}
      backgroundColor={colors.warningSoft}
      borderWidth={borderWidths.thin}
      borderColor={colors.warningText}
      borderRadius={radii[6]}
    >
      <View flexDirection="row" alignItems="flex-start" gap={12}>
        <View {...TILE} aria-hidden>
          <PathIcon d={GLYPHS.nube} size={20} strokeWidth={2.2} color={colors.warningText} />
        </View>
        <View flex={1} minWidth={0} gap={2}>
          <MText size="body" weight="extraBold" role="heading">
            {bandaTitulo(cola.porEnviar, cola.reintentando)}
          </MText>
          <MText size="md" weight="semibold" color={colors.ink}>
            {BANDA_CUERPO}
          </MText>
        </View>
      </View>
      <MText size="sm" weight="bold" color={colors.warningText} role="status">
        {estadoTxt(cola, intentado)}
      </MText>
      <Acciones cola={cola} onIntento={() => setIntentado(true)} onVerCuales={p.onVerCuales} />
    </View>
  );
}
