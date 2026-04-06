import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import globals from 'globals'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import svelteParser from 'svelte-eslint-parser'
import sveltePlugin from 'eslint-plugin-svelte'

const files = ['src/**/*.{js,ts,svelte}', 'tests/**/*.{js,ts}']
const tsFiles = ['src/**/*.{js,ts}', 'tests/**/*.{js,ts}']

export default [
  {
    ignores: [
      '.DS_Store',
      'node_modules/**',
      'build/**',
      '.svelte-kit/**',
      'package/**',
      '.env',
      '.env.*',
      '!*.env.example',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      '**/*.cjs',
    ],
  },
  js.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  {
    files,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
  {
    files: ['tests/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['src/**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/infinite-reactive-loop': 'off',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.js'],
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  eslintConfigPrettier,
]
