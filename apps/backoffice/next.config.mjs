import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';
import { securityHeaders } from '@xangarro/config/security';

/**
 * Same build shape as `apps/web` (see its next.config.mjs): vanilla-extract
 * is a webpack plugin, so every `next` invocation passes `--webpack`, and the
 * `.js` → `.ts` extension alias lets webpack resolve workspace TypeScript.
 *
 * The console is internal (ADR-063): nothing here may be indexed, framed or
 * sniffed. These headers apply to **every** response, static assets included.
 * The Content-Security-Policy is not here — it carries a per-request nonce, so
 * `src/proxy.ts` sets it (see `src/server/security/csp.ts`).
 */
const withVanillaExtract = createVanillaExtractPlugin();

/** @type {ReadonlyArray<{ key: string; value: string }>} */
export const SECURITY_HEADERS = securityHeaders({
  noindex: true,
  referrer: 'no-referrer',
  permissions: 'camera=(), microphone=(), geolocation=(), payment=()',
  hstsPreload: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@xangarro/tokens', '@xangarro/domain'],
  typedRoutes: true,
  async headers() {
    return [{ source: '/:path*', headers: [...SECURITY_HEADERS] }];
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default withVanillaExtract(nextConfig);
