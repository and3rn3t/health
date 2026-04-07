// Minimal ESLint flat config for TS + React + Vite
// More permissive rules for development
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
      'tailwind.config.*',
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
        projectService: false,
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
      // More permissive rules for development
      '@typescript-eslint/no-unused-vars': [
        'warn', // Downgrade to warning
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Allow any types with warning
      'react-hooks/exhaustive-deps': 'warn', // Warning instead of error
      'react-hooks/rules-of-hooks': 'error', // Keep this strict - important
      '@typescript-eslint/triple-slash-reference': 'warn', // Allow for test files
      'prefer-const': 'warn', // Downgrade to warning
      'no-case-declarations': 'warn', // Downgrade to warning
    },
  },
  // Test utilities don't participate in HMR — disable react-refresh
  {
    files: ['src/__tests__/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
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
