const tests = require('boostid/tests');
const config = require('../boostid.config');


describe('Visual regression on "dev"', () => {
  tests.visualReg(config, `https://dev-${config.name}.pantheonsite.io`);
});

describe('Visual regression on "updates"', () => {
  tests.visualReg(config, `https://updates-${config.name}.pantheonsite.io`);
});
