let config;
exports.init = (_config) => {
  config = _config;

  // config defaults
  if (!config.multidev) config.multidev = 'updates';
  if (!config.pages) config.pages = [];
  for (const _page of config.pages) {
    if (!_page.viewPorts) _page.viewPorts = [{ width: 1200, height: 800 }];
  }
};


const generateScreenshots = (base) => {

  if (!config)
    throw 'Provide a config object to the "init" function before any other tests';

  for (const { path, viewPorts } of config.pages) {
    describe(`Goes to path: ${path}`, () => {

      beforeAll(async () => {
        await page.goto(base + path, { waitUntil: 'networkidle0' });
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

exports.visualRegOnUpdates = () => generateScreenshots(`https://${config.multidev}-${config.name}.pantheonsite.io`);

exports.visualRegOnLive = () => generateScreenshots(config.liveSite);
