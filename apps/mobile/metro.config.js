// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Metro needs to watch the monorepo root so changes in workspace packages
// (`@cachink/ui`, `@cachink/domain`, etc.) trigger hot reload.
config.watchFolders = [workspaceRoot];

// Resolve node_modules from the app first, then the workspace root, then
// each workspace package's own node_modules. Disabling hierarchical lookup
// is required for pnpm so Metro doesn't climb past the workspace root and
// discover duplicate React copies — but disabling it also stops Metro
// from finding workspace peers that live in a sibling package's
// node_modules (e.g. `@cachink/sync-{lan,cloud}` are symlinked into
// `packages/ui/node_modules/@cachink/` by pnpm because they are
// optional peers of `@cachink/ui`, not deps of `apps/mobile`).
//
// Listing those package-local `node_modules` here lets the dynamic
// `await import('@cachink/sync-{lan,cloud}')` calls in
// `packages/ui/src/sync/{lan,cloud}-bridge.ts` resolve cleanly, while
// `disableHierarchicalLookup: true` still prevents Metro from
// discovering duplicate React copies further up the tree.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'packages/ui/node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// NodeNext `.js` suffix on TS source — Metro resolver hook.
//
// The workspace follows the TypeScript NodeNext / Bundler convention:
// every relative re-export carries a `.js` suffix even though the file
// on disk is `.ts` / `.tsx` (e.g. `export * from './lan-bridge.js';`
// in `packages/ui/src/sync/index.ts`). Vite/Vitest rewrite this; Metro
// does not. Without this hook the iOS bundle dies the first time it
// reaches a NodeNext-style barrel inside any `@cachink/*` package.
//
// We intercept relative imports ending in `.js` and try `.ts` / `.tsx`
// before falling back to Metro's default resolver. Limited to relative
// paths so node_modules `.js` resolution stays untouched.
const TS_REWRITE_EXTS = ['.ts', '.tsx'];
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    for (const ext of TS_REWRITE_EXTS) {
      try {
        return context.resolveRequest(context, moduleName.replace(/\.js$/, ext), platform);
      } catch {
        // Try next extension, then fall back to default resolution.
      }
    }
  }
  return upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

// Bundle splitting for sync packages (Slice 8 M2-C11).
//
// `@cachink/sync-{lan,cloud}` and the heavy `@powersync/react-native`
// peer are loaded via `await import('@cachink/sync-...')` from
// `packages/ui/src/sync/{lan,cloud}-bridge.ts` so Local-standalone users
// never download them. Metro respects dynamic imports — it emits a
// `__loadBundleAsync(...)` call and produces a separate split bundle —
// but only when the module isn't already in the initial bundle through
// some *other* static reach. `processModuleFilter` returning `false`
// is Metro's documented escape hatch: the module is excluded from the
// initial graph and is fetched lazily on the first dynamic import.
//
// Maestro `cloud-signup-signin.yaml` exercises the lazy-load happy path.
config.serializer = config.serializer ?? {};
config.serializer.processModuleFilter = (mod) => {
  if (
    /[\\/](@cachink[\\/](sync-lan|sync-cloud)|@powersync[\\/](react-native|common))[\\/]/.test(
      mod.path,
    )
  ) {
    return false;
  }
  return true;
};

module.exports = config;
