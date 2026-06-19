module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^openai$': '<rootDir>/__mocks__/openai.js',
    '^wx-server-sdk$': '<rootDir>/__mocks__/wx-server-sdk.js'
  },
  collectCoverageFrom: [
    'miniprogram/cloudfunctions/**/*.js',
    'miniprogram/utils/**/*.js',
    '!**/node_modules/**',
    '!**/test*/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}
