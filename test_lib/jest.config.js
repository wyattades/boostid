const path = require('path');

// NOTE: jest-environment-puppeteer and jest v24 are not compatible

module.exports = {
  rootDir: process.cwd(),
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  testEnvironment: 'jest-environment-puppeteer',
  // This only works in jest v23. In v24 use setupFilesBeforeEnv
  setupTestFrameworkScriptFile: path.resolve(__dirname, 'setup-test.js'),
  reporters: [ 'default', path.resolve(__dirname, 'image-reporter.js') ],
};
