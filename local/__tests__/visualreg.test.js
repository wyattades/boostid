const tests = require('boostid/tests');
const config = require('../boostid.config');


const testerSite = `https://${config.multidev}-${config.name}.pantheonsite.io`;

tests.visualReg(
  `https://dev-${config.name}.pantheonsite.io`,
  testerSite,
  config.pages,
);
