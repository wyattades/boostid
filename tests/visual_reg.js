const URL = require('url');


const TEST_RESULTS_DIR = '__boostid_results__';

/**
 * @typedef ViewPortConfig
 * @property {number} width
 * @property {number} height
 * @property {boolean} [isMobile=false]
 */

/**
 * @typedef PageConfig
 * @property {string} path Path of page e.g. "/my-page"
 * @property {ViewPortConfig[]} viewPorts Runs visual regression tests for each specified viewport
 * @property {string[]} [ignore] Array of CSS selectors to ignore for visual regression
 * @property {string[]} [elements] Array of CSS selectors to run visual regression on
 */

/**
 * @param {string} targetUrl Base url of website to test against
 * @param {string} devUrl Base url of website 
 * @param {PageConfig[]} pages Array of config object for each page
 */
exports.visualReg = (targetUrl, devUrl, pages) => {

  for (const url of [targetUrl, devUrl]) {

    describe(`Visual regression on: ${url}`, () => {

      for (const { path, elements = [], ignore = [], viewPorts } of pages) {
        describe(`Goes to path: ${path}`, () => {

          beforeAll(async () => {
            await page.goto(URL.resolve(url, path), { waitUntil: 'networkidle0' });
          }, 15000);

          for (const viewPort of viewPorts) {
            const viewPortKey = `${viewPort.width}x${viewPort.height}${viewPort.isMobile ? 'm' : ''}`;

            describe(`On viewport: ${viewPortKey}`, () => {

              beforeAll(async () => {
                await page.setViewport(viewPort);

                await page.evaluate((_ignore) => {
                  for (const sel of _ignore) {
                    document.querySelectorAll(sel).forEach((el) => {
                      el.style.visibility = 'hidden';
                    });
                  }
                }, ignore);
              }, 15000);

              for (let sel of elements) {

                let snapshotConfig;
                if (Array.isArray(sel))
                  [sel, snapshotConfig] = sel;

                if (typeof snapshotConfig !== 'object')
                  snapshotConfig = {};

                test(`Snapshot of: ${sel}`, async () => {

                  const element = await page.$(sel);
                  if (!element)
                    throw new Error('Could not find DOM element');

                  const image = await element.screenshot();
                  expect(image).toMatchImageSnapshot({
                    ...snapshotConfig,
                    customDiffDir: TEST_RESULTS_DIR,
                    customSnapshotIdentifier: encodeURIComponent(`${path}--${viewPortKey}--${sel}`),
                  });
                });
              }
            });
          }
        });
      }
    });
  }

};
