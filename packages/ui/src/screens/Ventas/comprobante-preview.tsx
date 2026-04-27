/**
 * ComprobantePreview — the "Compartir comprobante" modal (P1C-M3-T04
 * part 1/2). Renders the HTML string produced by
 * {@link useComprobanteHtml} inside a Modal so the user can preview
 * before sharing.
 *
 * Audit M-1 PR 3 fix (audit 2.16): the preview frame is now a
 * platform extension. On web/Tauri it mounts a sandboxed
 * `<iframe srcDoc={html}>` that renders the receipt 1:1 (the previous
 * implementation displayed raw HTML source as monospace text). On RN
 * a fallback frame with a clearer label ships until
 * `react-native-webview` is added — the audit's WebView migration is
 * one component swap once the dep lands.
 *
 * The native share sheet integration lands in Commit 14 — this file
 * exposes `onShare` as a callback the caller wires. Closing the modal
 * calls `onClose`.
 */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { View } from '@tamagui/core';
import type { Business, Sale } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useComprobanteHtml } from '../../hooks/use-comprobante-html';
import { colors } from '../../theme';
import { PreviewFrame } from './comprobante-preview-frame';

export interface ComprobantePreviewProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly sale: Sale | null;
  readonly business: Business | null;
  readonly onShare?: (html: string) => void;
  readonly sharing?: boolean;
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
