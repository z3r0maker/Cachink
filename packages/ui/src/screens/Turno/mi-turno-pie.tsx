/**
 * Mi turno's fixed foot, above the tab bar (MvTurno): «Bloquear la caja»
 * (secondary, the lock) and «Cerrar turno» (the yellow primary), which opens
 * the two-step Cierre (ADR-147, M-17). On a tablet the rail and the sidebar
 * carry the lock, so the foot keeps only «Cerrar turno»; with no open turno
 * it keeps only the lock (phone), or nothing.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { Btn, GLYPHS, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors } from '../../theme';
import { useCajaLayout } from '../AppShell/use-caja-layout';

export interface MiTurnoPieProps {
  /** Locks the caja: the operator list comes back. */
  readonly onBloquear?: () => void;
  /** Opens Cierre; absent while there is no turno to close. */
  readonly onCerrar?: () => void;
}

function Bloquear(p: { readonly onPress: () => void; readonly solo: boolean }): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={p.solo ? 1 : undefined}>
      <Btn
        variant="secondary"
        size="xl"
        fullWidth={p.solo}
        onPress={p.onPress}
        testID="turno-bloquear"
        icon={<PathIcon d={ICONS.lock} size={18} strokeWidth={2.2} />}
      >
        {t('shell.turno.bloquear')}
      </Btn>
    </View>
  );
}

function Cerrar(p: { readonly onPress: () => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        onPress={p.onPress}
        testID="turno-cerrar-mi-turno"
        icon={<PathIcon d={GLYPHS.flecha} size={18} strokeWidth={2.6} />}
      >
        {t('shell.turno.cerrarTurnoCorto')}
      </Btn>
    </View>
  );
}

export function MiTurnoPie(p: MiTurnoPieProps): ReactElement | null {
  const telefono = useCajaLayout() === 'phone';
  const bloquear = telefono ? p.onBloquear : undefined;
  if (bloquear === undefined && p.onCerrar === undefined) return null;
  return (
    <View
      testID="turno-pie"
      flexDirection="row"
      gap={10}
      paddingHorizontal={16}
      paddingVertical={12}
      backgroundColor={colors.gray200}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      {bloquear === undefined ? null : (
        <Bloquear onPress={bloquear} solo={p.onCerrar === undefined} />
      )}
      {p.onCerrar === undefined ? null : <Cerrar onPress={p.onCerrar} />}
    </View>
  );
}
