/**
 * Slack / Discord incoming-webhook adapter for `UrgentNotifier` (N-10).
 *
 * The message is deliberately thin — kind, title, tenant id and a link into
 * the console. The body never leaves our infrastructure: it is customer-written
 * and may hold an RFC, a phone number or worse, and a chat workspace is a
 * third party (LFPDPPP). Staff click through to read it behind 2FA.
 */
import type { SupportItem } from '@xangarro/domain';

import type { UrgentNotifier } from './urgent-notifier';

export class AlertDeliveryError extends Error {
  constructor(
    readonly code: 'WEBHOOK_REJECTED' | 'WEBHOOK_UNREACHABLE',
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'AlertDeliveryError';
  }
}

export interface WebhookNotifierConfig {
  readonly url: string;
  readonly fetch: typeof fetch;
  /** Origin of the console, for the link, e.g. `https://admin.xangarro.mx`. */
  readonly consoleUrl: string;
  readonly timeoutMs?: number;
}

export const DEFAULT_CONSOLE_URL = 'https://admin.xangarro.mx';

export function urgentMessage(item: SupportItem, consoleUrl: string): string {
  const title = item.title.length > 120 ? `${item.title.slice(0, 119)}…` : item.title;
  const tenant = item.businessId ? ` · negocio ${item.businessId}` : '';
  return `[URGENTE] ${item.kind}${tenant}: ${title}\n${consoleUrl}/inbox/${item.id}`;
}

/** Discord wants `content`; Slack (and Slack-compatible hooks) want `text`. */
function payload(url: string, text: string): Record<string, string> {
  const host = new URL(url).hostname;
  const discord =
    host === 'discord.com' || host.endsWith('.discord.com') || host === 'discordapp.com';
  return discord ? { content: text } : { text };
}

async function post(cfg: WebhookNotifierConfig, text: string): Promise<Response> {
  try {
    return await cfg.fetch(cfg.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload(cfg.url, text)),
      signal: AbortSignal.timeout(cfg.timeoutMs ?? 5_000),
    });
  } catch (cause) {
    throw new AlertDeliveryError('WEBHOOK_UNREACHABLE', 'No se pudo contactar el webhook.', {
      cause,
    });
  }
}

export function webhookNotifier(cfg: WebhookNotifierConfig): UrgentNotifier {
  return {
    async notifyUrgent(item) {
      const res = await post(cfg, urgentMessage(item, cfg.consoleUrl));
      if (!res.ok) {
        throw new AlertDeliveryError('WEBHOOK_REJECTED', `El webhook respondió ${res.status}.`);
      }
    },
  };
}

/**
 * The notifier the app uses, from `ALERT_WEBHOOK_URL` (and `ADMIN_BASE_URL`
 * for links). None when the URL is unset or not https: urgent items then
 * reach staff through the inbox and the digest only.
 */
export function urgentNotifierFromEnv(
  env: Readonly<Record<string, string | undefined>>,
  fetchImpl: typeof fetch,
): UrgentNotifier | undefined {
  const url = env.ALERT_WEBHOOK_URL;
  if (!url || !URL.canParse(url) || new URL(url).protocol !== 'https:') return undefined;
  return webhookNotifier({
    url,
    fetch: fetchImpl,
    consoleUrl: env.ADMIN_BASE_URL ?? DEFAULT_CONSOLE_URL,
  });
}
