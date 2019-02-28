module.exports = {
  launch: {
    // executablePath: 'google-chrome-unstable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
};

if (process.env.BOOSTID_DEV) {
  module.exports.launch.headless = false;
  module.exports.launch.slowMo = 100;
}
