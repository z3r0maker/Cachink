/**
 * ComprobantePreview — the "Compartir comprobante" modal (P1C-M3-T04
 * part 1/2). Renders the HTML string produced by
 * {@link useComprobanteHtml} inside a Modal so the user can preview
 * before sharing.
 *
 * The native share sheet integration lands in Commit 14 — this file
 * exposes `onShare` as a callback the caller wires. Closing the modal
 * calls `onClose`.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Business, Sale } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useComprobanteHtml } from '../../hooks/use-comprobante-html';
import { colors, radii } from '../../theme';

export interface ComprobantePreviewProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly sale: Sale | null;
  readonly business: Business | null;
  readonly onShare?: (html: string) => void;
  readonly sharing?: boolean;
}

function PreviewFrame({ html }: { html: string }): ReactElement {
  return (
    <View
      testID="comprobante-preview-frame"
      borderWidth={2}
      borderColor={colors.black}
      borderRadius={radii[2]}
      padding={12}
      backgroundColor={colors.offwhite}
      style={{ overflow: 'auto', maxHeight: '50vh' }}
    >
      <Text
        fontFamily="monospace"
        fontSize={11}
        color={colors.gray600}
        // Display the raw HTML source so the user can verify what will
        // be shared. The native/web share handlers rasterize the HTML
        // into PNG/PDF in Commit 14.
      >
        {html}
      </Text>
    </View>
  );
}

export function ComprobantePreview(props: ComprobantePreviewProps): ReactElement {
  const { t } = useTranslation();
  const html = useComprobanteHtml(props.sale, props.business);

  if (!html) {
    return (
      <Modal
        open={props.open}
        onClose={props.onClose}
        title={t('comprobante.title')}
        testID="comprobante-preview"
      >
        <Text color={colors.gray600}>{t('common.error')}</Text>
      </Modal>
    );
  }

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('comprobante.title')}
      testID="comprobante-preview"
    >
      <PreviewFrame html={html} />
      <View marginTop={12} flexDirection="row" gap={8}>
        <Btn
          variant="primary"
          onPress={() => props.onShare?.(html)}
          disabled={props.sharing === true || !props.onShare}
          fullWidth
          testID="comprobante-share"
        >
          {t('comprobante.share')}
        </Btn>
        <Btn variant="ghost" onPress={props.onClose} testID="comprobante-close">
          {t('comprobante.cerrar')}
        </Btn>
      </View>
    </Modal>
  );
}
