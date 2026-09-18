import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import boundaries from 'eslint-plugin-boundaries';

/**
 * Shared ESLint flat config for the Cachink monorepo.
 *
 * Encodes the layer boundaries from CLAUDE.md §4.2. Each package declares its
 * element type via `settings.boundaries/elements` below, and the
 * `boundaries/element-types` rule enforces which layers may import which.
 *
 * Layers (outermost to innermost):
 *   apps         → may import anything
 *   ui           → domain (types), application, data (interfaces only)
 *   application  → domain
 *   sync         → domain, data (interfaces only)
 *   data         → domain (types only)
 *   domain       → nothing internal
 *
 * Also loads sonarjs (complexity) and unicorn (best practices).
 */
export default tseslint.config(
  // Global ignores
  {
    ignores: [
      // archive/ holds parked code (ADR-053 §6, docs/plan F-02/F-03): never built, never linted.
      'archive/**',
      '**/archive/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.d.ts',
      // Build output and generated artefacts — not ours to lint. Every package
      // lints itself with a bare `eslint .`, so anything not named here IS
      // linted; that is what `scripts/lint-coverage.test.ts` enforces.
      '**/.next/**',
      '**/.expo/**',
      'apps/*/ios/**',
      'apps/*/android/**',
      '**/test-results/**',
      '**/playwright-report/**',
      'e2e-reports/**',
      'audit-screenshots/**',
      // Read-only mirror of the Claude Design project (ADR-058).
      'design-reference/**',
      // Deno, not Node: `supabase/functions/**` imports from URLs, carries
      // `deno-lint-ignore-file` pragmas, and is checked by `deno lint` — this
      // config's module resolution and rule set do not apply to it.
      //
      // NOT a clean bill of health. When it was linted once during the
      // lint-coverage fix, `bug-report/index.ts` reported 13 errors: a 271-line
      // file, `validateErrorEvent` at complexity 22, `validateBugReport` at 17,
      // and six `any` on an endpoint that validates untrusted input. Tracked as
      // F-10; do not treat this ignore as the debt being paid.
      'supabase/functions/**',
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
        { type: 'sync', pattern: 'packages/sync-*/src/**' },
        { type: 'testing', pattern: 'packages/testing/src/**' },
        { type: 'app', pattern: 'apps/**/src/**' },
      ],
    },
    rules: {
      // === Layer boundary rules (CLAUDE.md §4.2) ===
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: [] },
            { from: 'application', allow: ['domain'] },
            { from: 'data', allow: ['domain'] },
            { from: 'sync', allow: ['domain', 'data'] },
            { from: 'ui', allow: ['domain', 'application', 'data'] },
            { from: 'testing', allow: ['domain', 'application', 'data'] },
            {
              from: 'app',
              allow: ['domain', 'application', 'data', 'ui', 'sync', 'testing'],
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

  // Allow config files to use require / any.
  //
  // This block was dead until the lint-coverage fix: `**/*.config.*` sat in the
  // global ignores above, so the files it relaxes were never linted at all.
  // `metro.config.js` is CommonJS because Metro `require()`s it — that is the
  // tool's contract, not a style choice.
  {
    files: ['**/*.config.{js,cjs,ts,mjs}', '**/eslint.config.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
