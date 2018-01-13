module.exports = {
  root: true,
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
  plugins: [
    'node',
    'prettier',
  ],
  extends: [
    'eslint:recommended', 
    'plugin:node/recommended'
  ],
  env: {
    browser: false,
    node: true
  },
  rules: {
    'prettier/prettier': ['error', {
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
    }],
  },
  overrides: [
    // test files
    {
      files: ['tests/**/*.js'],
      env: {
        qunit: true
      }
    }
  ]
};
