const { toMatchImageSnapshot } = require('jest-image-snapshot');
const PuppeteerEnvironment = require('jest-environment-puppeteer');


class TestEnvironment extends PuppeteerEnvironment {
  async setup() {
    await super.setup();

    expect.extend({ toMatchImageSnapshot });
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = TestEnvironment;
