module.exports = {
  launch: {
    // executablePath: 'google-chrome-unstable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  browserContext: 'incognito',
};

if (process.env.BOOSTID_DEV) {
  module.exports.launch.headless = false;
  if (process.env.BOOSTID_DEV === 'slow')
    module.exports.launch.slowMo = 100;
}
