module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'google',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // quotes: ['error', 'double'],
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-unused-vars': 0,
    'import/no-unresolved': 0,
    'require-jsdoc': 0,
    indent: ['error', 2],
  },
};
