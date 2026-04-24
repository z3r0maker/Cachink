/**
 * Share — React Native variant (P1C-M3-T04 part 2/2, mobile).
 *
 * Uses React Native's built-in `Share.share` which ships with core —
 * no additional native module rebuild required. Surfaces the system
 * share sheet (WhatsApp, Messages, Mail, Files on iOS; Android's
 * equivalent intent picker). The HTML is attached as the `message`
 * body alongside a `title`; richer PNG / PDF rasterization lands in a
 * later phase once the bundler picks up `react-native-view-shot` in
 * an Expo config-plugin step.
 *
 * Metro auto-picks this file over `./share.ts` on mobile. Tests cover
 * the bridge between Share.share's promise and the ShareResult union.
 */

import { Share, type ShareContent, type ShareOptions } from 'react-native';
import type { ShareResult, ShareTarget } from './share';

export async function shareComprobante(target: ShareTarget): Promise<ShareResult> {
  const content: ShareContent = {
    title: target.title,
    message: `${target.title}\n\n${target.text}`,
  };
  const options: ShareOptions = {
    subject: target.title,
    dialogTitle: target.title,
  };
  try {
    const result = await Share.share(content, options);
    if (result.action === Share.dismissedAction) {
      return { shared: false, method: 'cancelled' };
    }
    return { shared: true, method: 'native' };
  } catch {
    return { shared: false, method: 'cancelled' };
  }
}
