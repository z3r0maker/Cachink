import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import { colors } from '@xangarro/tokens';

import { anton, jakarta } from './fonts';
import '../styles/global.css';

export const metadata: Metadata = {
  title: 'Xangarro!',
  description: 'Finanzas para emprendedores.',
};

export const viewport: Viewport = {
  themeColor: colors.yellow,
};

/**
 * Zod 4 probes whether it may compile validators with `Function("")`. Under
 * the portal's CSP (SEC-WEB-01) that probe is an `eval` the policy forbids —
 * harmless, Zod catches it and validates without compiling, but it would
 * file a violation per page and bury real ones. Zod reads its config from
 * `globalThis.__zod_globalConfig`, so this sets `jitless` before any app code
 * runs, whichever chunk loads first.
 */
const ZOD_JITLESS =
  'globalThis.__zod_globalConfig=Object.assign(globalThis.__zod_globalConfig||{},{jitless:true});';

/**
 * Every route renders per request (SEC-WEB-01): the CSP nonce is minted per
 * request in `src/proxy.ts`, and Next can stamp it only on pages it renders
 * then — reading the request headers opts the whole tree into dynamic
 * rendering, and hands this layout the nonce for its one inline script.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="es-MX" className={`${jakarta.variable} ${anton.variable}`}>
      <body>
        <Script id="zod-jitless" strategy="beforeInteractive" nonce={nonce}>
          {ZOD_JITLESS}
        </Script>
        {children}
      </body>
    </html>
  );
}
