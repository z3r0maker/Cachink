/**
 * «¿Desvincular esta caja?» (MvDesvincularBorrar): two cards, «Solo
 * desvincular» (chosen, as before) and «Desvincular y borrar». Wiping waits
 * until nothing is unsent: the amber note offers «Enviar ahora», or «Ver no
 * enviados» when the server refused something. While the phone empties, the
 * sheet only says so.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  BottomSheet,
  Btn,
  MText,
  NotaTono,
  OptionCardGroup,
  Spinner,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { useDesvincular, type Desvincular, type OpcionDesvincular } from './use-desvincular';

export interface DesvincularSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onOpenRejected: () => void;
  /** Restarts the app after a wipe (the mobile shell's). */
  readonly reiniciar?: () => void;
}

function NotaBorrar(p: { d: Desvincular; onOpenRejected: () => void }): ReactElement {
  const { t } = useTranslation();
  if (p.d.pendientes === 0)
    return (
      <NotaTono
        tono="verde"
        titulo={t('settings.unlinkTodoEnviado')}
        testID="unlink-todo-enviado"
      />
    );
  return (
    <NotaTono
      tono="ambar"
      titulo={t('settings.unlinkSinEnviar', { count: p.d.pendientes })}
      testID="unlink-sin-enviar"
    >
      {p.d.rechazados ? (
        <Btn variant="dark" fullWidth onPress={p.onOpenRejected} testID="unlink-ver-no-enviados">
          {t('settings.unlinkVerNoEnviados')}
        </Btn>
      ) : (
        <Btn
          variant="dark"
          fullWidth
          onPress={p.d.enviar}
          loading={p.d.enviando}
          testID="unlink-enviar"
        >
          {p.d.enviando ? t('settings.unlinkEnviando') : t('settings.unlinkEnviarAhora')}
        </Btn>
      )}
    </NotaTono>
  );
}

function Acciones(p: { d: Desvincular; onClose: () => void }): ReactElement {
  const { t } = useTranslation();
  const borrar = p.d.opcion === 'borrar';
  return (
    <View gap={8}>
      <Btn
        variant="destructiveFilled"
        size="xl"
        fullWidth
        disabled={borrar && p.d.pendientes > 0}
        onPress={p.d.confirmar}
        testID="unlink-confirm"
      >
        {borrar ? t('settings.unlinkBorrar') : t('settings.unlinkConfirm')}
      </Btn>
      <Btn variant="quiet" fullWidth onPress={p.onClose} testID="unlink-cancel">
        {t('settings.unlinkCancelar')}
      </Btn>
    </View>
  );
}

function Borrando(): ReactElement {
  const { t } = useTranslation();
  return (
    <View alignItems="center" gap={12} paddingVertical={16} testID="unlink-borrando" aria-busy>
      <Spinner size="lg" />
      <MText size="md" weight="semibold" color={colors.gray600} textAlign="center">
        {t('settings.unlinkBorrandoCuerpo')}
      </MText>
    </View>
  );
}

function Elegir(p: { d: Desvincular; onOpenRejected: () => void }): ReactElement {
  const { t } = useTranslation();
  const { d } = p;
  return (
    <View gap={14}>
      <MText size="md" weight="semibold">
        {t('settings.unlinkConfirmBody')}
      </MText>
      <OptionCardGroup<OpcionDesvincular>
        value={d.opcion}
        onChange={d.elegir}
        wrap
        testID="unlink-opciones"
        options={[
          {
            key: 'solo',
            icon: 'archive',
            label: t('settings.unlinkSolo'),
            description: t('settings.unlinkSoloDetalle'),
          },
          {
            key: 'borrar',
            icon: 'trash-2',
            label: t('settings.unlinkBorrar'),
            description: t('settings.unlinkBorrarDetalle'),
          },
        ]}
      />
      {d.opcion === 'borrar' ? <NotaBorrar d={d} onOpenRejected={p.onOpenRejected} /> : null}
      {d.fallo ? (
        <NotaTono tono="ambar" titulo={t('settings.unlinkBorrarFallo')} testID="unlink-fallo" />
      ) : null}
    </View>
  );
}

export function DesvincularSheet(props: DesvincularSheetProps): ReactElement {
  const { t } = useTranslation();
  const d = useDesvincular({ onDone: props.onClose, reiniciar: props.reiniciar });
  return (
    <BottomSheet
      open={props.open}
      onClose={d.borrando ? () => undefined : props.onClose}
      title={d.borrando ? t('settings.unlinkBorrandoTitulo') : t('settings.unlinkConfirmTitle')}
      footer={d.borrando ? null : <Acciones d={d} onClose={props.onClose} />}
      testID="unlink-sheet"
    >
      {d.borrando ? <Borrando /> : <Elegir d={d} onOpenRejected={props.onOpenRejected} />}
    </BottomSheet>
  );
}
