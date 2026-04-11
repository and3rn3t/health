// ESLint flat config for TS + React + Vite
// Strict rules aligned with CLAUDE.md project standards
import js from '@eslint/js';
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      // Core ignores - build outputs and dependencies
      'node_modules/**',
      'dist/**',
      'dist-worker/**',
      '.wrangler/**',
      '.wrangler-test/**',
      'build/**',
      'out/**',
      '.next/**',

      // Development and tooling files that don't need linting
      'server/**',
      'ios/**',
      'docs/**',
      'public/**',
      'src/components/_archive/**',
      'src/_archive/**',
      'scripts/**/*.ps1',
      'scripts/**/*.sh',
      'scripts/**/*.js',
      'scripts/**/*.mjs',
      '**/*.md',
      '**/*.txt',

      // ML files requiring optional dependencies
      'src/lib/ml/LiDARMLEngine.ts',
      '**/*.log',
      '**/*.json',
      '**/*.yml',
      '**/*.yaml',

      // Build and cache directories
      '.cache/**',
      'coverage/**',
      'test-results/**',
      'logs/**',
      '**/tmp/**',
      '**/temp/**',

      // Generated and minified files
      '**/*.js.map',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/*.generated.*',
      '.tsbuildinfo',

      // Config files (handled separately below)
      'vite.*.config.*',
      'wrangler.toml',
      'wrangler.*.toml',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Node-targeted JS (scripts, tools)
  {
    files: ['server/**/*.js', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Align JS unused vars severity with TS override
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Root / build config files (Node context)
  {
    files: [
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      'vite.config.*',
      'postcss.config.*',
      'eslint.config.*',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'off', // Node globals provided above
    },
  },
  // Browser-targeted JS (src, public, runtime config)
  {
    files: ['src/**/*.js', 'app-config.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      'jsx-a11y': eslintPluginJsxA11y,
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
    },
    rules: {
      // TS files use the TS compiler for globals; disable base no-undef
      'no-undef': 'off',
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginJsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Strict rules — aligned with CLAUDE.md: no `any`, prefer `const`
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      '@typescript-eslint/triple-slash-reference': 'warn',
      'prefer-const': 'error',
      'no-case-declarations': 'warn'
    },
  },
  // Test files — relax rules that create noise in test code
  {
    files: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/__tests__/**/*.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Standard patterns: shadcn/ui exports variants alongside components,
  // React contexts export provider + hook, performance providers export hooks
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/contexts/**/*.{ts,tsx}',
      'src/lib/performance/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
