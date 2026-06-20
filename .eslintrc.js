module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  globals: {
    wx: 'readonly',
    getApp: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    requirePlugin: 'readonly'
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  rules: {
    'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
    'no-console': 'off',
    'no-empty': ['warn', { allowEmptyCatch: true }]
  },
  ignorePatterns: ['node_modules/', 'miniprogram_npm/', 'coverage/']
}
