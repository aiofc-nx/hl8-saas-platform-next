import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      'src/examples/**/*',
      'src/docs/**/*',
      'src/scripts/**/*',
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      'jest.config.ts',
      '**/examples/**/*',
      '**/docs/**/*',
      '**/scripts/**/*'
    ],
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      // 基础代码质量规则
      'arrow-body-style': ['error', 'as-needed'],
      'guard-for-in': 'error',
      'comma-dangle': ['error', 'never'],
      'prefer-rest-params': 'error',
      'no-bitwise': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-new': 'error',
      'no-debugger': 'error',
      'no-dupe-class-members': 'error',
      'no-eval': 'error',
      'no-throw-literal': 'error',
      'no-fallthrough': 'error',
      'no-unused-expressions': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'radix': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      
      // TypeScript 规则
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-deprecated': 'off', // 禁用需要类型信息的规则
      
      // 命名规范
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
      ],
    },
  },
];
