// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Metro needs to watch the monorepo root so changes in workspace packages
// (`@cachink/ui`, `@cachink/domain`, etc.) trigger hot reload.
config.watchFolders = [workspaceRoot];

// Resolve node_modules from the app first, then the workspace root. Disabling
// hierarchical lookup is required for pnpm so Metro doesn't climb past the
// workspace root and discover duplicate React copies.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
