import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';
import { securityHeaders, UPLOADED_BYTES_CSP } from '@xangarro/config/security';

/**
 * The vanilla-extract plugin is a **webpack** integration, and Next 16 builds
 * with Turbopack by default — the two are incompatible, and the failure is a
 * `WorkerError: Call retries were exceeded` that says nothing useful. Every
 * `next` invocation in this package therefore passes `--webpack` explicitly.
 * See task P-20 for the spike that established this, and ADR-057 for why the
 * stack is vanilla-extract rather than Tailwind.
 */
const withVanillaExtract = createVanillaExtractPlugin();

/**
 * Every response, static assets included (SEC-WEB-01, N-26). Enforced from
 * day one because none of them can break a page: no framing (clickjacking of
 * «Revocar» and «Generar código»), no MIME sniffing, HSTS, a referrer that
 * never leaves the origin with a path.
 */
export const SECURITY_HEADERS = securityHeaders({
  referrer: 'strict-origin-when-cross-origin',
  permissions: 'camera=(), microphone=(), geolocation=(), payment=()',
});

/**
 * The path prefixes `src/proxy.ts` leaves alone: API responses and static
 * files. Next reads the proxy's `matcher` statically, so it is a literal
 * there; `tests/security-headers.test.ts` holds it to this list.
 */
export const PROXY_SKIPS = [
  'api/',
  '_next/static',
  '_next/image',
  'favicon.ico',
  'icon.svg',
  'apple-icon.png',
  'sw.js',
  'sql-wasm.wasm',
  'sin-conexion.html',
];

const CSP = 'Content-Security-Policy';

/**
 * One Content-Security-Policy per response, written by exactly one layer
 * (audit F-01, F-04), so the result never depends on how a host merges a
 * header set twice. `next start` drops a route handler's header when a rule
 * here already set that name, and lets the proxy's replace it; another host
 * need not do either.
 *
 * - Pages: the proxy's enforced policy, and nothing from here.
 * - What the proxy skips: no framing.
 * - Uploaded bytes (logos, product photos): the sandbox. A later rule
 *   overrides an earlier one, so these come last. Their route handlers send
 *   the same value, which is what reaches the wire if a rule here is lost.
 */
export const HEADER_RULES = [
  { source: '/:path*', headers: [...SECURITY_HEADERS] },
  {
    source: `/((?:${PROXY_SKIPS.join('|')}).*)`,
    headers: [{ key: CSP, value: "frame-ancestors 'none'" }],
  },
  { source: '/api/logos/:businessId', headers: [{ key: CSP, value: UPLOADED_BYTES_CSP }] },
  {
    source: '/api/productos/:productId/imagen',
    headers: [{ key: CSP, value: UPLOADED_BYTES_CSP }],
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return HEADER_RULES;
  },
  // Where the build goes. The E2E suite sets NEXT_DIST_DIR=.next-e2e/<port>:
  // several sessions build in this directory, and a `next build` that replaces
  // `.next` under a running `next start` makes the webpack runtime chunk 500,
  // so the page never renders and every spec fails. A private dir per port
  // cannot be pulled out from under the server using it.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // The coverage build (ADR-102): source maps on both sides, so the V8 data the
  // E2E run collects maps back to `src/`, and no minifier — see `webpack` below.
  ...(process.env.XG_COVERAGE === '1' ? { productionBrowserSourceMaps: true } : {}),
  experimental: {
    serverSourceMaps: process.env.XG_COVERAGE === '1',
    serverMinification: process.env.XG_COVERAGE !== '1',
  },
  // `@xangarro/tokens`, `@xangarro/domain` and `@xangarro/caja` ship TypeScript
  // sources, not a build output, so Next must compile them rather than treat
  // them as external.
  transpilePackages: ['@xangarro/tokens', '@xangarro/domain', '@xangarro/caja'],
  typedRoutes: true,
  // Sentry's Node SDK (B-18) loads Node built-ins at run time; bundling it
  // breaks. Keep it external on the Node server…
  serverExternalPackages: ['@sentry/node'],
  webpack: (config, { nextRuntime }) => {
    // Coverage build only: the minifier rewrites structure — `if/else` into
    // `a ? b : c`, statements into sequences — and coverage reads statements
    // and branches from that structure. Mapped back to `src/`, they came out
    // as phantom branches spanning real ones, merged beside the unit suite's
    // true ones (ADR-102, 2026-09-24). Lines were never affected.
    if (process.env.XG_COVERAGE === '1') config.optimization.minimize = false;
    // …and absent from any non-Node compile. `next dev` also compiles
    // `src/instrumentation.ts` for the Edge runtime, where `path` and the other
    // built-ins do not exist; without this every page returned 500 in dev
    // (`Can't resolve 'path'`) while production builds still passed.
    if (nextRuntime !== 'nodejs') {
      config.resolve.alias = { ...(config.resolve.alias ?? {}), '@sentry/node': false };
    }
    // The workspace packages are ESM TypeScript and follow the Node
    // convention of importing siblings as `./colors.js` while the file on
    // disk is `colors.ts`. TypeScript resolves that; webpack does not,
    // unless told. Without this every `@xangarro/*` import fails with
    // `Module not found: Can't resolve './colors.js'`.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default withVanillaExtract(nextConfig);
