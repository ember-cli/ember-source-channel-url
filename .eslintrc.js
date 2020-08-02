module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 2018,
  },
  plugins: ['node', 'prettier'],
  extends: ['eslint:recommended', 'plugin:node/recommended'],
  env: {
    browser: false,
    node: true,
  },
  rules: {
    'prettier/prettier': 'error',
  },
  overrides: [
    // test files
    {
      files: ['tests/**/*.js'],
      env: {
        qunit: true,
      },
    },
  ],
};
