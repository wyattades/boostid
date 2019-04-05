const URL = require('url');
const { join } = require('path');


const TEST_RESULTS_DIR = '__boostid_results__';
const SNAPSHOTS_DIR = join(TEST_RESULTS_DIR, 'snapshots');

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

  // let ctx; // new browser context
  // let page; // page in new context

  for (const url of [targetUrl, devUrl]) {

    describe(`Visual regression on: ${url}`, () => {

      for (const { path, elements = [], ignore = [], viewPorts } of pages) {
        describe(`Goes to path: ${path}`, () => {

          // beforeAll(async () => {
          //   if (!ctx) {
          //     ctx = await browser.createIncognitoBrowserContext();
          //     page = await ctx.newPage();
          //   }
          // }, 15000);

          test('Load page', async () => {
            await page.goto(URL.resolve(url, path), { waitUntil: 'networkidle2' });
          }, 30000);

          for (const viewPort of viewPorts) {
            const viewPortKey = `${viewPort.width}x${viewPort.height}${viewPort.isMobile ? 'm' : ''}`;

            describe(`On viewport: ${viewPortKey}`, () => {

              beforeAll(async () => {
                await page.setViewport(viewPort);

                try {
                  await page.evaluate((_ignore) => {
                    /* global document */
                    for (const sel of _ignore) {
                      document.querySelectorAll(sel).forEach((el) => {
                        el.style.visibility = 'hidden';
                      });
                    }
                  }, ignore);
                } catch (err) {
                  console.log('Failed to hide elements', err.toString());
                }
              }, 30000);

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
                    customSnapshotsDir: SNAPSHOTS_DIR,
                    customDiffDir: TEST_RESULTS_DIR,
                    customSnapshotIdentifier: encodeURIComponent(`${path}--${viewPortKey}--${sel}`),
                  });
                }, 20000);
              }
            });
          }
        });
      }
    });
  }

};
