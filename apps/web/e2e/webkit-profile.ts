import { mkdirSync, readFileSync } from 'node:fs';

import type {
  BrowserContext,
  BrowserContextOptions,
  LaunchOptions,
  PlaywrightWorkerArgs,
  TestInfo,
} from '@playwright/test';

/**
 * WebKit's contexts get a real profile directory (J1-22, J5-24).
 *
 * Headless WebKit's OPFS storage process needs one: in Playwright's default,
 * ephemeral context the register's database fails to open with «UnknownError:
 * The operation failed for an unknown transient reason», which no Safari a
 * person uses ever says — Safari always has a profile. The O-02 spike found
 * the same and launched a persistent context by hand; this is that, for every
 * WebKit test, so the register in the `webkit-operador` project opens its
 * database exactly as it does in Chromium.
 *
 * A persistent context takes no `storageState` at launch, so the project's is
 * applied right after. Each test gets its own directory under its output
 * folder — but on macOS WebKit keeps OPFS out of it, in one directory per
 * origin shared by every profile (`~/Library/WebKit/org.webkit.Playwright/
 * WebsiteData/Default`). The first run left a register's database there, and
 * the next test's register opened it, turno and all: «Ya tienes un turno
 * abierto». So a project that runs the register empties the origin's OPFS
 * before each test, which is what a fresh context is — opting in with
 * `vaciarOpfs`, and only with `workers: 1`: three WebKit workers reaching for
 * that one directory at once fail with the same «transient reason».
 *
 * The session cookie is `Secure` in a production build (server/session.ts)
 * and the suite serves plain http on localhost. Chromium treats localhost as
 * secure and sends it; WebKit does not, and every portal page answered with
 * the login. Production is https, so the cookie goes in without the flag here:
 * the harness's transport, not the app, is what differs.
 */
export interface ProfileArgs {
  readonly playwright: PlaywrightWorkerArgs['playwright'];
  readonly launchOptions: LaunchOptions;
  readonly headless: boolean;
  readonly options: BrowserContextOptions;
  /** Empty the origin's OPFS first (the `vaciarOpfs` option). */
  readonly vaciar: boolean;
}

/** The project option a register-running WebKit project sets. */
export interface OpcionesWebkit {
  readonly vaciarOpfs: boolean;
}

export async function webkitConPerfil(
  { playwright, launchOptions, headless, options, vaciar }: ProfileArgs,
  testInfo: TestInfo,
): Promise<BrowserContext> {
  const dir = testInfo.outputPath('webkit-profile');
  mkdirSync(dir, { recursive: true });
  const { storageState, ...rest } = options;
  const context = await playwright.webkit.launchPersistentContext(dir, {
    ...launchOptions,
    headless,
    ...rest,
  });
  if (storageState !== undefined) await context.setStorageState(sinSecure(storageState));
  if (vaciar && rest.baseURL !== undefined) await vaciarOpfs(context, rest.baseURL);
  return context;
}

type Estado = Exclude<BrowserContextOptions['storageState'], string | undefined>;

/** The storage state with its cookies sendable over the suite's plain http. */
function sinSecure(state: string | Estado): Estado {
  const parsed: Estado =
    typeof state === 'string' ? JSON.parse(readFileSync(state, 'utf8')) : state;
  return { ...parsed, cookies: parsed.cookies.map((c) => ({ ...c, secure: false })) };
}

/** Empties the origin's OPFS from the context's first tab, then blanks the tab. */
async function vaciarOpfs(context: BrowserContext, baseURL: string): Promise<void> {
  const tab = context.pages()[0] ?? (await context.newPage());
  // Any document of the origin will do; a 404 renders nothing of the app.
  await tab.goto(new URL('/__vaciar-opfs', baseURL).href);
  await tab.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const names: string[] = [];
    for await (const name of (root as unknown as { keys(): AsyncIterable<string> }).keys()) {
      names.push(name);
    }
    await Promise.all(names.map((n) => root.removeEntry(n, { recursive: true })));
  });
  await tab.goto('about:blank');
}
