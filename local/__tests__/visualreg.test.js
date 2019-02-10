const tests = require('boostid/tests');
const config = require('../boostid.config');


describe('Visual regression on "dev"', () => {
  tests.visualReg(config.pages, `https://dev-${config.name}.pantheonsite.io`);
});

describe(`Visual regression on "${config.multidev}"`, () => {
  tests.visualReg(config.pages, `https://${config.multidev}-${config.name}.pantheonsite.io`);
});
