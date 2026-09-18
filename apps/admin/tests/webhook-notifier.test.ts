import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  AlertDeliveryError,
  urgentNotifierFromEnv,
  webhookNotifier,
} from '@/server/alerts/webhook-notifier';

import { BUSINESS, item } from './support/inbox';

const SLACK = 'https://hooks.slack.com/services/T0/B0/xyz';
const DISCORD = 'https://discord.com/api/webhooks/1/abc';
const CONSOLE = 'https://admin.xangarro.mx';

interface Call {
  url: string;
  init: RequestInit;
}

function fakeFetch(status = 200, calls: Call[] = []): typeof fetch {
  return async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(status === 204 ? null : 'ok', { status });
  };
}

const urgent = item({
  urgent: true,
  kind: 'escalacion',
  title: 'No puedo cobrar',
  body: 'Mi RFC es XAXX010101000 y mi teléfono 5512345678',
  businessId: BUSINESS,
});

function body(call: Call | undefined): Record<string, string> {
  assert.ok(call);
  return JSON.parse(String(call.init.body)) as Record<string, string>;
}

describe('webhookNotifier', () => {
  it('posts a Slack message with the kind, title and a link to the item', async () => {
    const calls: Call[] = [];
    await webhookNotifier({
      url: SLACK,
      fetch: fakeFetch(200, calls),
      consoleUrl: CONSOLE,
    }).notifyUrgent(urgent);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, SLACK);
    assert.equal(calls[0]?.init.method, 'POST');
    const text = body(calls[0]).text ?? '';
    assert.match(text, /URGENTE/);
    assert.match(text, /escalacion/);
    assert.match(text, /No puedo cobrar/);
    assert.ok(text.includes(`${CONSOLE}/inbox/${urgent.id}`));
  });

  it('uses Discord’s `content` field for a Discord webhook', async () => {
    const calls: Call[] = [];
    await webhookNotifier({
      url: DISCORD,
      fetch: fakeFetch(204, calls),
      consoleUrl: CONSOLE,
    }).notifyUrgent(urgent);
    const sent = body(calls[0]);
    assert.equal(typeof sent.content, 'string');
    assert.equal(sent.text, undefined);
  });

  it('never sends the item body to the third party', async () => {
    const calls: Call[] = [];
    await webhookNotifier({
      url: SLACK,
      fetch: fakeFetch(200, calls),
      consoleUrl: CONSOLE,
    }).notifyUrgent(urgent);
    assert.doesNotMatch(String(calls[0]?.init.body), /XAXX010101000|5512345678/);
  });

  it('throws when the webhook answers with an error status', async () => {
    const n = webhookNotifier({ url: SLACK, fetch: fakeFetch(500), consoleUrl: CONSOLE });
    await assert.rejects(
      n.notifyUrgent(urgent),
      (e: unknown) => e instanceof AlertDeliveryError && e.code === 'WEBHOOK_REJECTED',
    );
  });

  it('throws when the webhook cannot be reached', async () => {
    const down: typeof fetch = async () => {
      throw new TypeError('fetch failed');
    };
    const n = webhookNotifier({ url: SLACK, fetch: down, consoleUrl: CONSOLE });
    await assert.rejects(
      n.notifyUrgent(urgent),
      (e: unknown) => e instanceof AlertDeliveryError && e.code === 'WEBHOOK_UNREACHABLE',
    );
  });
});

describe('urgentNotifierFromEnv', () => {
  it('builds a notifier from ALERT_WEBHOOK_URL', () => {
    assert.ok(urgentNotifierFromEnv({ ALERT_WEBHOOK_URL: SLACK }, fakeFetch()));
  });

  it('returns none when the URL is unset, or is not https', () => {
    assert.equal(urgentNotifierFromEnv({}, fakeFetch()), undefined);
    assert.equal(
      urgentNotifierFromEnv({ ALERT_WEBHOOK_URL: 'http://hooks.slack.com/x' }, fakeFetch()),
      undefined,
    );
    assert.equal(urgentNotifierFromEnv({ ALERT_WEBHOOK_URL: 'nope' }, fakeFetch()), undefined);
  });
});
