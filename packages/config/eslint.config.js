import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import boundaries from 'eslint-plugin-boundaries';
import { resolve } from 'node:path';

/**
 * Every package lints itself with `eslint . --config ../../eslint.config.js`,
 * and with an explicit `--config` ESLint resolves `files`/`ignores` globs
 * against the working directory, not the config file. A glob like
 * `packages/ui/src/components/**` then matched nothing from `packages/ui`,
 * and neither did the boundaries element patterns. Anchoring both to the repo
 * root makes the result independent of where ESLint is run from.
 */
const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const WORKSPACE_RESOLVER = resolve(import.meta.dirname, 'eslint-workspace-resolver.cjs');

/**
 * Shared ESLint flat config for the Xangarro monorepo.
 *
 * Encodes the layer boundaries from CLAUDE.md §4.2. Each package declares its
 * element type via `settings.boundaries/elements` below, and the
 * `boundaries/dependencies` rule enforces which layers may import which.
 * `scripts/lint-boundaries.test.ts` proves that it fires.
 *
 * Layers (outermost to innermost), as enforced:
 *   app          → domain, application, data, ui, sync, testing
 *   ui           → domain, application, data, sync
 *   testing      → domain, application, data, ui; sync (types only)
 *   sync         → domain, data
 *   application  → domain; data (types only: repository interfaces)
 *   data         → domain
 *   domain       → nothing internal
 *
 * Packages with no element below (contracts, data-pg, auth-core, tokens,
 * email, observability) are unclassified, and the rule skips them.
 *
 * Also loads sonarjs (complexity) and unicorn (best practices).
 */
const configs = tseslint.config(
  // Global ignores
  {
    ignores: [
      // archive/ holds parked code (ADR-053 §6, docs/plan F-02/F-03): never built, never linted.
      'archive/**',
      '**/archive/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      // Next build output, including Playwright's per-port NEXT_DIST_DIRs
      // (.next, .next-e2e/<port>): generated, like dist/.
      '**/.next*/**',
      // Bundled spike output (e.g. apps/web/e2e/spikes/*/.out): esbuild, not source.
      '**/.out/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.d.ts',
      '**/*.config.js',
      '**/plugins/**',
      '**/vitest.config.*',
    ],
  },

  // Base JS recommendations
  ...tseslint.configs.recommended,

  // Plugin configs
  {
    plugins: {
      sonarjs,
      unicorn,
      boundaries,
    },
    settings: {
      // Element patterns below are relative to this, not to the cwd.
      'boundaries/root-path': REPO_ROOT,
      // Maps `@xangarro/*` to package source; see the resolver's header.
      'import/resolver': { [WORKSPACE_RESOLVER]: {} },
      'boundaries/elements': [
        { type: 'domain', pattern: 'packages/domain/src/**' },
        { type: 'application', pattern: 'packages/application/src/**' },
        { type: 'data', pattern: 'packages/data/src/**' },
        {
          type: 'ui',
          pattern: [
            'packages/ui/src/**',
            // Storybook config + story files live next to the UI package but
            // are not implementations of the boundary rules themselves.
            // Counting them as UI-scope keeps lint clean without a new layer.
            'packages/ui/.storybook/**',
            'packages/ui/**/*.stories.{ts,tsx,mdx}',
          ],
        },
        { type: 'sync', pattern: ['packages/sync/src/**', 'packages/sync-*/src/**'] },
        { type: 'testing', pattern: 'packages/testing/src/**' },
        { type: 'app', pattern: 'apps/**/src/**' },
      ],
    },
    rules: {
      // === Layer boundary rules (CLAUDE.md §4.2) ===
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: { type: 'domain' }, disallow: { to: { type: '*' } } },
            {
              // Use cases take repository *interfaces* (CLAUDE.md §3–4); the
              // Drizzle implementations stay out of reach.
              from: { type: 'application' },
              allow: [
                { to: { type: 'domain' } },
                { to: { type: 'data' }, dependency: { kind: 'type' } },
              ],
            },
            { from: { type: 'data' }, allow: { to: { type: 'domain' } } },
            { from: { type: 'sync' }, allow: { to: { type: ['domain', 'data'] } } },
            {
              // ui is the phone's body: it wires the cloud sync bridge,
              // activation and entitlement from @xangarro/sync (ADR-104).
              from: { type: 'ui' },
              allow: { to: { type: ['domain', 'application', 'data', 'sync'] } },
            },
            {
              // `MockRepositoryProvider` wraps ui's `RepositoryProvider`, and
              // lives in testing so it stays off the runtime graph (ADR-033).
              from: { type: 'testing' },
              allow: [
                { to: { type: ['domain', 'application', 'data', 'ui'] } },
                // In-memory fakes implement sync's repository interfaces.
                { to: { type: 'sync' }, dependency: { kind: 'type' } },
              ],
            },
            {
              from: { type: 'app' },
              allow: {
                to: { type: ['domain', 'application', 'data', 'ui', 'sync', 'testing'] },
              },
            },
          ],
        },
      ],

      // === Complexity / God-class detection (CLAUDE.md §4.4) ===
      'sonarjs/cognitive-complexity': ['error', 12],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-collapsible-if': 'warn',

      // === File-size limits (CLAUDE.md §4.4) ===
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ['error', 12],

      // === TypeScript strictness (CLAUDE.md §12 rule 10) ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // === Unicorn selected rules (not all — keep overhead low) ===
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off', // SQLite returns null; we want it
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-node-protocol': 'error',
    },
  },

  // Prevent components from importing their own barrel (causes require cycles)
  {
    files: ['packages/ui/src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../index', '../index.ts'],
              message:
                'Components must import siblings directly (e.g., "../Card/card"), not from the barrel ("../index"). Barrel self-imports create require cycles that crash Metro.',
            },
          ],
        },
      ],
    },
  },

  // Relax rules for test files and Storybook stories
  {
    files: [
      '**/tests/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/*.stories.{ts,tsx,mdx}',
      '**/.storybook/**/*.{ts,tsx}',
      // Shared contract factories in @xangarro/testing live in `src/contract/`
      // but are test code by nature — they wrap `describe`/`it` calls from
      // vitest and exist solely to be invoked from real test files.
      '**/contract/**/*.ts',
      '**/fixtures/**/*.ts',
    ],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'unicorn/filename-case': 'off',
    },
  },

  // Drizzle migrations: filenames must match the journal tag
  // (`0001_capture_client`), and SQL payloads are long by nature.
  {
    files: ['**/drizzle/migrations/*.ts'],
    rules: {
      'unicorn/filename-case': 'off',
      'max-lines': 'off',
    },
  },

  // Allow config files to use require / any
  {
    files: ['**/*.config.{js,ts,mjs}', '**/eslint.config.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);

export default configs.map((config) => ({ basePath: REPO_ROOT, ...config }));
