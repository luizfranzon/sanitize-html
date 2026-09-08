const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const nPlugin = require('eslint-plugin-n');
const promisePlugin = require('eslint-plugin-promise');
const globals = require('globals');
const { defineConfig, globalIgnores } = require('eslint/config');

module.exports = defineConfig([
  globalIgnores([
    '**/node_modules'
  ]),
  js.configs.recommended,
  nPlugin.configs['flat/recommended-module'],
  promisePlugin.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      'no-unused-vars': [ 'error', {
        varsIgnorePattern: '^_[^_].*$|^_$',
        args: 'none',
        ignoreRestSiblings: true,
        caughtErrors: 'none'
      } ],
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',

      '@stylistic/array-bracket-spacing': [ 'warn', 'always' ],
      '@stylistic/arrow-spacing': [ 'error', { before: true, after: true } ],
      '@stylistic/block-spacing': [ 'error', 'always' ],
      '@stylistic/brace-style': [ 'warn', '1tbs' ],
      '@stylistic/comma-dangle': [ 'error', 'never' ],
      '@stylistic/comma-spacing': [ 'error', { before: false, after: true } ],
      '@stylistic/eol-last': 'error',
      '@stylistic/indent': [ 'error', 2, {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        ignoreComments: false
      } ],
      '@stylistic/key-spacing': [ 'error', { beforeColon: false, afterColon: true } ],
      '@stylistic/keyword-spacing': [ 'error', { before: true, after: true } ],
      '@stylistic/no-multiple-empty-lines': [ 'error', { max: 1, maxEOF: 0 } ],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/object-curly-spacing': [ 'error', 'always' ],
      '@stylistic/quotes': [ 'warn', 'single' ],
      '@stylistic/semi': [ 'error', 'always' ],
      '@stylistic/space-before-blocks': [ 'error', 'always' ]
    }
  },
  {
    files: [ 'test/**/*.js' ],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    },
    rules: {
      'n/no-extraneous-require': 'off',
      'n/no-unpublished-require': 'off',
      'no-console': 'error'
    }
  }
]);
