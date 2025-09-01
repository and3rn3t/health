// Minimal ESLint flat config for TS + React + Vite
// More permissive rules for development
import js from '@eslint/js';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'server/**',
      '.wrangler/**',
      'dist/**',
      'dist-worker/**',
      'node_modules/**',
      '**/*.js.map',
      '**/tmp/**',
      '**/temp/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: false,
      },
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
    },
    rules: {
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
