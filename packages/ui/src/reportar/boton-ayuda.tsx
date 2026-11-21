/**
 * The caja's help button (RpPuerta, RpTableta): a yellow 44 px square with
 * the help mark, in the header on every tab; the tablet's top bar has room
 * for the word «Ayuda» beside it. It opens the report sheet.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { GLYPHS, MText, PathIcon } from '../components/index';
import { useTranslation } from '../i18n/index';
import { borderWidths, colors, radii } from '../theme';
import { useReportar } from './reportar-store';

export function BotonAyuda(props: { readonly conTexto?: boolean }): ReactElement {
  const { t } = useTranslation();
  const abrir = useReportar((s) => s.abrir);
  return (
    <Pressable
      testID="ayuda-reportar"
      role="button"
      aria-label={t('reportar.ayudaAria')}
      onPress={() => abrir()}
      style={{
        height: 44,
        minWidth: 44,
        paddingHorizontal: props.conTexto ? 12 : 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        borderRadius: radii[2],
        backgroundColor: colors.yellow,
      }}
    >
      <PathIcon d={GLYPHS.ayuda} size={22} strokeWidth={2.2} />
      {props.conTexto ? (
        <MText size="md" weight="extraBold">
          {t('reportar.ayuda')}
        </MText>
      ) : null}
    </Pressable>
  );
}
