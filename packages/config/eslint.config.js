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
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.d.ts',
      '**/*.config.js',
      '**/*.config.ts',
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
      'boundaries/elements': [
        { type: 'domain', pattern: 'packages/domain/src/**' },
        { type: 'application', pattern: 'packages/application/src/**' },
        { type: 'data', pattern: 'packages/data/src/**' },
        { type: 'ui', pattern: 'packages/ui/src/**' },
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
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
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
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],

      // === Unicorn selected rules (not all — keep overhead low) ===
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off', // SQLite returns null; we want it
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-node-protocol': 'error',
    },
  },

  // Relax rules for test files
  {
    files: ['**/tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
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
