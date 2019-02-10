/**
 * @typedef PageConfig
 * @property {string} path Path of page e.g. "/my-page"
 * @property {{width: number, height: number, isMobile: boolean}[]} viewPorts
 */

/**
 * @param {PageConfig[]} pages Array of config object for each page
 * @param {string} base Base url
 */
exports.visualReg = (pages, base) => {

  for (const { path, viewPorts } of pages) {
    describe(`Goes to path: ${path}`, () => {

      beforeAll(async () => {
        await page.goto(base + path, { waitUntil: 'networkidle0' });

        // expect(page.url().startsWith(base + path)).toBeTruthy();
      }, 15000);

      for (const viewPort of viewPorts) {
        test(`On viewport ${viewPort.width}x${viewPort.height}`, async () => {
          await page.setViewport(viewPort);
          const image = await page.screenshot();
          expect(image).toMatchImageSnapshot({
            customSnapshotIdentifier: `${path.replace(/\//g, '_')}-${viewPort.width}x${viewPort.height}`,
          });
        });
      }
    });
  }

};
