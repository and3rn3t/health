// Minimal ESLint flat config for TS + React + Vite
// More permissive rules for development
import js from '@eslint/js';
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
      'build/**',
      'out/**',
      '.next/**',
      
      // Development and tooling files that don't need linting
      'server/**',
      'ios/**',
      'docs/**',
      'scripts/**/*.ps1',
      'scripts/**/*.sh',
      '**/*.md',
      '**/*.txt',
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
    files: ['scripts/**/*.js', 'server/**/*.js', '**/*.cjs', '**/*.mjs'],
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
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
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
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-undef': 'off', // Node globals provided above
    },
  },
  // Browser-targeted JS inside src
  {
    files: ['src/**/*.js'],
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
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
    },
    rules: {
      // TS files use the TS compiler for globals; disable base no-undef
      'no-undef': 'off',
      ...eslintPluginReactHooks.configs.recommended.rules,
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
];
