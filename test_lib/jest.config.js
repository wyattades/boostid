const path = require('path');

module.exports = {
  rootDir: process.cwd(),
  testRegex: '/__tests__/.*\\.js$',
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  testEnvironment: path.resolve(__dirname, 'test-environment.js'),
  reporters: [ 'default', path.resolve(__dirname, 'image-reporter.js') ],
};
