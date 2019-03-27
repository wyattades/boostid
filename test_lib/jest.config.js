const path = require('path');


module.exports = {
  rootDir: process.cwd(),
  testMatch: [ path.resolve(__dirname, 'visual_reg.test.js'), '<rootDir>/__tests__/**/*.[jt]s?(x)' ],
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  testEnvironment: 'jest-environment-puppeteer',
  setupFilesAfterEnv: [ path.resolve(__dirname, 'setup-test.js'), 'expect-puppeteer' ],
};
