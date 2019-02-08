
exports.visualReg = (config, base) => {

  for (const { path, viewPorts } of config.pages) {
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

// exports.visualReg = (config, multidev) => generateScreenshots(`https://${config.multidev}-${config.name}.pantheonsite.io`);

// exports.visualRegOnUpdates = () => generateScreenshots(`https://${config.multidev}-${config.name}.pantheonsite.io`);

// exports.visualRegOnLive = () => generateScreenshots(config.liveSite);
