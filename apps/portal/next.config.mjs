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
  // `@xangarro/tokens` and `@xangarro/domain` ship TypeScript sources, not a
  // build output, so Next must compile them rather than treat them as external.
  transpilePackages: ['@xangarro/tokens', '@xangarro/domain'],
  typedRoutes: true,
  webpack: (config) => {
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
