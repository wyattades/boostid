
let config;
exports.init = (_config) => {
  config = _config;

  // config defaults
  if (!config.multidev) config.multidev = 'updates';
  for (const _page in config.pages) {
    if (!_page.viewPorts) _page.viewPorts = [{ width: 1200, height: 800 }];
  }
};


const generateScreenshots = (base) => {

  if (!config)
    throw 'Provide a config object to the "init" function before any other tests';

  test.each(config.pages)('Goto page ', async (_page) => {

    await page.goto(base + _page.path, { waitUntil: 'networkidle0' });

    for (const viewPort of _page.viewPorts) {
      await page.setViewport(viewPort);
      const image = await page.screenshot();
      expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: `${_page.path.replace('/', '_')}-${viewPort.width}x${viewPort.height}`,
      });
    }

  }, 20000);

};

exports.visualRegOnUpdates = () => generateScreenshots(`https://${config.multidev}-${config.name}.pantheonsite.io`);

exports.visualRegOnLive = () => generateScreenshots(config.liveSite);
