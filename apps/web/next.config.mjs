import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';

/**
 * The vanilla-extract plugin is a **webpack** integration, and Next 16 builds
 * with Turbopack by default — the two are incompatible, and the failure is a
 * `WorkerError: Call retries were exceeded` that says nothing useful. Every
 * `next` invocation in this package therefore passes `--webpack` explicitly.
 * See task P-20 for the spike that established this, and ADR-057 for why the
 * stack is vanilla-extract rather than Tailwind.
 */
const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Where the build goes. The E2E suite sets NEXT_DIST_DIR=.next-e2e/<port>:
  // several sessions build in this directory, and a `next build` that replaces
  // `.next` under a running `next start` makes the webpack runtime chunk 500,
  // so the page never renders and every spec fails. A private dir per port
  // cannot be pulled out from under the server using it.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // `@xangarro/tokens` and `@xangarro/domain` ship TypeScript sources, not a
  // build output, so Next must compile them rather than treat them as external.
  transpilePackages: ['@xangarro/tokens', '@xangarro/domain'],
  typedRoutes: true,
  // Sentry's Node SDK (B-18) loads Node built-ins at run time; bundling it
  // breaks. Keep it external on the Node server…
  serverExternalPackages: ['@sentry/node'],
  webpack: (config, { nextRuntime }) => {
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
