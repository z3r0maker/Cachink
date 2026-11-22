import type { BrowserContext, Page } from 'playwright-core';

import { startApiProxy } from './api-proxy';
import type { SeededBug } from './bugs';
import { pageScript } from './page-script';

/**
 * A seeded bug on the web runner (S-12). A network rule puts the bug's proxy
 * in front of the portal, and the run's browser uses it as its base URL: the
 * register's sale push, activation and pulls come from its Web Worker, which
 * Playwright's route interception does not see. A page mutation goes on after
 * the runner walks the door, so the door is the real one, and before the actor
 * gets the screen.
 */
export interface WebBase {
  /** What the run's browser uses as its base URL. */
  readonly baseUrl: string;
  close(): Promise<void>;
}

/** The portal itself, or the bug's proxy in front of it. */
export async function webBase(bug: SeededBug | undefined, portal: string): Promise<WebBase> {
  if (bug === undefined || !('net' in bug.web)) {
    return { baseUrl: portal, close: async () => undefined };
  }
  const proxy = await startApiProxy({ upstream: portal, rule: bug.web.net });
  return { baseUrl: `http://127.0.0.1:${proxy.port}`, close: () => proxy.close() };
}

/** After the door: the bug's page mutation, on later pages and the one already open. */
export async function afterDoor(
  bug: SeededBug,
  context: BrowserContext,
  page: Page,
): Promise<void> {
  if (!('page' in bug.web)) return;
  const content = pageScript(bug.web.page);
  await context.addInitScript({ content });
  await page.evaluate(content);
}
