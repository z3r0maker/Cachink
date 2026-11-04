/**
 * Privacidad y términos (MvAjustes): the aviso de privacidad and the terms,
 * each a row that opens xangarro.mx in the browser. App Review 5.1.1(i) wants
 * the privacy policy reachable from inside the app, not only in the listing.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { AVISO_PUBLICO_URL, TERMINOS_PUBLICO_URL } from '@xangarro/domain';
import { abrirEnNavegador } from '../../app/abrir-en-navegador';
import { GLYPHS, NavRows, type NavRowItem } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { SettingsNote, SettingsSectionTitle } from './settings-section';

export function SettingsPrivacySection(): ReactElement {
  const { t } = useTranslation();
  const items: NavRowItem[] = [
    {
      key: 'aviso',
      title: t('settings.avisoPrivacidad'),
      detail: t('settings.avisoPrivacidadDetalle'),
      icon: GLYPHS.privacidad,
      tint: colors.blueSoft,
      external: true,
      onPress: () => abrirEnNavegador(AVISO_PUBLICO_URL),
      testID: 'settings-aviso-privacidad',
    },
    {
      key: 'terminos',
      title: t('settings.terminos'),
      detail: t('settings.terminosDetalle'),
      icon: GLYPHS.terminos,
      tint: colors.gray100,
      external: true,
      onPress: () => abrirEnNavegador(TERMINOS_PUBLICO_URL),
      testID: 'settings-terminos',
    },
  ];
  return (
    <View gap={8} testID="settings-privacy">
      <SettingsSectionTitle title={t('settings.privacidadSection')} />
      <NavRows items={items} label={t('settings.privacidadSection')} />
      <SettingsNote text={t('settings.privacidadNota')} />
    </View>
  );
}
