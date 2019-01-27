const { toMatchImageSnapshot } = require('jest-image-snapshot');
const PuppeteerEnvironment = require('jest-environment-puppeteer');


class TestEnvironment extends PuppeteerEnvironment {
  async setup() {
    console.log('Before setup');
    await super.setup();
    console.log('After setup');
    expect.extend({ toMatchImageSnapshot });
  }

  async teardown() {
    await super.teardown();
    console.log('teardown');
  }
}

module.exports = TestEnvironment;
